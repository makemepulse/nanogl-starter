import LightmapRenderer, { LightmapRenderFunction } from "@webgl/core/LightmapRenderer";
import { RenderContext } from "@webgl/core/Renderer";
import RenderMask from "@webgl/core/RenderMask";
import { mat4, quat, vec3 } from "gl-matrix";
import Node from "nanogl-node";
import Material from "nanogl-pbr/Material";
import LightSetup from "nanogl-pbr/lighting/LightSetup";
import PixelFormats from "nanogl-pf";
import GLState from "nanogl-state/GLState";
import ArrayBuffer from "nanogl/arraybuffer";
import Fbo from "nanogl/fbo";
import { GLContext } from "nanogl/types";
import ShadowcatcherPass from "./ShadowCatcherPass";
import UnlitPass from "nanogl-pbr/UnlitPass";
import DirectionalLight from "nanogl-pbr/lighting/DirectionalLight";
import { Uniform } from "nanogl-pbr/Input";
import gui from "@webgl/dev/gui";
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw";


const FBO_SIZE = 256;
const MAX_SAMPLES = 200
const SAMPLES_PER_FRAMES = 4

const XAXIS = vec3.fromValues(1, 0, 0);
const YAXIS = vec3.fromValues(0, 1, 0);
const ZAXIS = vec3.fromValues(0, 0, 1);

const V3A = vec3.create();
const V3B = vec3.create();
const M4 = mat4.create();

/**
 * ShadowCatcher create a plane and cast soft shadows of the scene on it. 
 * It jitter a directional light and accumulate the shadows on a F32 texture
 */
export default class ShadowCatcher extends Node {
  /**
   * the directional light used for shadow casting
   */
  light : DirectionalLight
  
  setup: LightSetup

  plane: ArrayBuffer

  /**
   * Fbo used for shadow accumulation, 
   * it's texture is then mapped onto the original plane and draw in the scene in multiply blendmode
   */
  fbo: Fbo

  /**
   * this pass render the result of the shadow mapping in UV space. It basically bake the shadow casted onto the rendered mesh
   */
  shadowpass: ShadowcatcherPass;
  shadowmaterial: Material;

  /**
   * control the transform of the shadow plane
   */
  planeNode: Node;

  /**
   * the final unlit pass in multiply blendmode used to render the softshadow result oon screen
   */
  renderPass: UnlitPass;
  material: Material;

  /**
   * modulate the intensity of the renderPass color based on the number of samples currently accumulated
   * It compensate the darkness of the shadowmap when not all samples has been accumulated yet
   */
  colorFactor : Uniform

  /**
   * the number of samples accumulated on the FBO
   */
  sampleIndex = 0

  /**
   * the base direction of the directional light, and the tangent and bitangant of this direction
   * encoded in a mat4
   */
  _lightDirBasis = mat4.create()

  /**
   * set the base direction of the directional light
   */
  setLightDirection( dir:vec3 ){
    console.log('setLightDirection', dir);
    
    vec3.normalize( dir, dir )
    const tangent = (Math.abs(dir[0])>0.9) ? ZAXIS : XAXIS
    vec3.cross( V3A, tangent, dir )
    vec3.normalize( V3A, V3A )
    vec3.cross( tangent, dir, V3A )

    this._lightDirBasis.set([
      V3A[0], V3A[1], V3A[2], 0 ,
      dir[0], dir[1], dir[2], 0 ,
      tangent[0], tangent[1], tangent[2], 0 ,
      0, 0, 0, 1
    ])

    this.invalidate()
  }



  /**
   * the softness of the shadow. 
   * Larger values increase the jittering of the directional light around the base light direction
   * 0 = no jitterring 
   * 1 = jiterring 180° around base direction
   */
  set softness( v:number ){
    this.invalidate()
    this._softness = v
  }

  get softness(){
    return this._softness
  }
  
  private _softness = 0.9



  constructor( private gl:GLContext ){

    super()

    this.planeNode = new Node()
    this.planeNode.setScale(4)
    this.add(this.planeNode)

    this.light = new DirectionalLight()
    this.light.castShadows = true
    this.light.shadowmapSize = FBO_SIZE
    this.add(this.light)

    this.setLightDirection(YAXIS)

    this.setup = new LightSetup()
    this.setup.bounds.fromMinMax( [-2,-1,-2], [2,5,2] )

    this.setup.add( this.light )

    // craete a simple quad with position and uvs
    this.plane = new ArrayBuffer( gl, new Float32Array([
      +1, 0, -1, 1, 0,
      -1, 0, -1, 0, 0,
      +1, 0, +1, 1, 1,
      -1, 0, +1, 0, 1,
    ]) )

    this.plane.attrib( 'aPosition', 3, gl.FLOAT )
    this.plane.attrib( 'aTexCoord0', 2, gl.FLOAT )

    
    // find a suitable Floating point format for the accumulation buffer
    const pf = PixelFormats.getInstance( gl )
    const fmt = pf.getRenderableFormat([
      pf.RGB16F,
      pf.RGBA16F,
      pf.RGB32F,
      pf.RGBA32F,
    ])
    
    
    this.fbo = new Fbo( gl )
    this.fbo.attachColor( fmt.format, fmt.type, fmt.internal ) 
    this.fbo.resize(FBO_SIZE, FBO_SIZE)


    // craete the shadow pass
    this.shadowpass = new ShadowcatcherPass( this.setup )
    this.shadowpass.mask = RenderMask.BLENDED
    this.shadowpass.setLight( this.light )
    this.shadowpass.version.guessFromContext( gl )
    this.shadowpass.maxSamples = MAX_SAMPLES
    this.shadowpass.glconfig
      .enableBlend()
      .blendFunc(gl.ONE, gl.ONE)
      .enableCullface(false)
      .enableDepthTest(false)

    this.shadowmaterial = new Material(gl)
    this.shadowmaterial.addPass(this.shadowpass)

    // create the render pass
    this.renderPass = new UnlitPass()
    this.renderPass.baseColor.attachSampler().set(this.fbo.getColorTexture())
    this.colorFactor = this.renderPass.baseColorFactor.attachUniform()
    this.renderPass.mask = RenderMask.BLENDED
    this.renderPass.glconfig
      .enableBlend()
      .blendFunc(gl.ZERO, gl.SRC_COLOR)
      .enableCullface()
      .enableDepthTest()

    this.material = new Material(gl)
    this.material.addPass(this.renderPass)


    /// #if DEBUG
    const f = gui.folder('ShadowCatcher')
    f.range(this, "softness", 0, 1)
    f.addRotation({r:quat.create()}, "r").onChange((r)=>{
      this.setLightDirection( vec3.transformQuat( V3B, YAXIS, r ) )
    })
    /// #endif
  }

  /**
   * invalidate the shadows
   * it will reset the sample index and clear the accumulation buffer
   */
  invalidate(){
    this.sampleIndex = 0
  }

  /**
   * Called in RTT loop
   * 
   */
  renderShadowmap(renderFunction: LightmapRenderFunction){
    for (let i = 0; i < SAMPLES_PER_FRAMES; i++) {
      this._renderShadowmap(renderFunction)
    }

    const f = MAX_SAMPLES / this.sampleIndex
    this.colorFactor.set( f, f, f )
  }
  
  /**
   * 
   * @param out create uniformly distributed direction around baseDir vector
   * @param solidAngle 
   * @param baseDir 
   */
  createRandomDirection( out:vec3, solidAngle = Math.PI/2 ){
    
    const r1 = Math.random()
    const r2 = Math.random()
    
    mat4.rotateY( M4, this._lightDirBasis, r1 * Math.PI * 2.0)
    mat4.rotateZ( M4, M4, r2 * solidAngle )

    DebugDraw.drawGuizmo(M4)

    out[0] = M4[4]
    out[1] = M4[5]
    out[2] = M4[6]
  }

  _renderShadowmap(renderFunction: LightmapRenderFunction){
    if( this.sampleIndex >= MAX_SAMPLES ) return
    this.createRandomDirection(this.light.position, this._softness*Math.PI/2)
    // const lightPos = this.light.position
    // randomUnitVector(lightPos)
    // lightPos[1] = Math.abs(lightPos[1]) + .5
    this.light.lookAt(vec3.create())
    this.light.invalidate()
    this.updateWorldMatrix()
    
    this.setup.prepare(this.gl, );
    LightmapRenderer.render( this.gl, this.setup, renderFunction)


    this.fbo.bind()
    this.fbo.defaultViewport()

    if( this.sampleIndex === 0 ){
      this.gl.clearColor(0, 0, 0, 0)
      this.fbo.clear()
    }

    this.shadowAccumulationPass()

    this.sampleIndex++
  }
  
  
  
  shadowAccumulationPass( ){
    
    const state = GLState.get(this.gl)
    this.updateWorldMatrix()
    
    this.shadowpass.sampleIndex = this.sampleIndex
    const pass = this.shadowmaterial.getPass()
    const prg = pass.getProgram()
    this.plane.attribPointer(prg)
    
    state.now(this.shadowpass.glconfig)
    
    pass.prepare(this.planeNode, null);
    this.plane.drawTriangleStrip()
    
  }
  
  render( context : RenderContext ){

    if( (context.mask & this.shadowpass.mask) === 0 ) return

    const state = GLState.get(this.gl)
    this.updateWorldMatrix()

    const pass = this.material.getPass()
    const prg = pass.getProgram()
    this.plane.attribPointer(prg)

    state.now(this.renderPass.glconfig)
    
    pass.prepare(this.planeNode, context.camera);
    this.plane.drawTriangleStrip()

  }

  dispose(){
    gui.clearFolder('ShadowCatcher')
  }
}