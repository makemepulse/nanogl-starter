import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import AssetDatabase from "@webgl/resources/AssetDatabase"
import UnlitPass from "nanogl-pbr/UnlitPass"
import TexCoord from "nanogl-pbr/TexCoord"
import Lighting from "@webgl/engine/Lighting"
import Chunk from "nanogl-pbr/Chunk"
import Input, { ShaderType } from "nanogl-pbr/Input"
import ChunksSlots from "nanogl-pbr/ChunksSlots"
import gui from "@webgl/dev/gui"
import { CreateGui, DeleteGui, GuiFolder, RangeGui } from "@webgl/dev/gui/decorators"

@GuiFolder('Lightmap')
class LightmapChunk extends Chunk {
  
  readonly lightmapInput: Input

  @RangeGui(0, 2)
  readonly lightmapExposure: Input
  
  @RangeGui(0, 2)
  readonly iblCutoffMult  : Input

  @RangeGui(0, 1)
  readonly iblCutoffOffset: Input



  constructor() {
    super(true, false);
    this.lightmapInput    = new Input('lightmapInput'    , 4, ShaderType.FRAGMENT )
    this.lightmapExposure = new Input('lightmapExpo'     , 1, ShaderType.FRAGMENT )
    this.iblCutoffMult    = new Input('lmIblCutoffMult'  , 1, ShaderType.FRAGMENT )
    this.iblCutoffOffset  = new Input('lmIblCutoffOffset', 1, ShaderType.FRAGMENT )

    this.addChild( this.lightmapInput )
    this.addChild( this.lightmapExposure )
    this.addChild( this.iblCutoffMult )
    this.addChild( this.iblCutoffOffset )

    this.lightmapExposure.attachConstant(1)
    this.iblCutoffMult   .attachConstant(1)
    this.iblCutoffOffset .attachConstant(0)

  }
  
  
  protected _genCode(slots: ChunksSlots): void {
    const code = `
    vec4 rgbm = lightmapInput();
    vec3 lmvalue = ( rgbm.rgb * 16.0 * rgbm.a );
    // vec3 lmvalue = pow(lightmapInput(), vec3(3.2));
    float occlu = saturate( dot( lmvalue*lmIblCutoffMult(), vec3(1.0) )-lmIblCutoffOffset() );
    lightingData.lightingColor *= occlu;
    lightingData.lightingColor += brdfData.diffuse * lmvalue * lightmapExpo() ;
    // lightingData.lightingColor = lightingData.lightingColor * 0.0001 + occlu;
    `
    slots.add( 'postlightsf', code )
  }
}

/**
 * Illustrate creation of a MaterialPass from scratch
 */
export default class LightmapSample implements IScene {

  readonly gl: GLContext
  gltfSample: GltfScene
  root: Node
  unlitPass: UnlitPass
  lighting: Lighting
  lightmapChunk: LightmapChunk


  constructor(renderer: Renderer) {
    this.gl = renderer.gl
    this.root = new Node()

    this.lighting   = new Lighting( this.gl )
    this.lighting.ibl.ambientExposure = 0
    this.root.add( this.lighting.root)

    this.lighting.ibl.enableBoxProjection = true
    this.lighting.ibl.boxProjectionSize.set([2, 1.5, 2])
    this.lighting.ibl.y = this.lighting.ibl.boxProjectionSize[1]/2
    
    this.unlitPass = new UnlitPass()
    this.unlitPass.glconfig
    .enableDepthTest()
    .enableCullface()
    
    this.gltfSample = new GltfScene( 'samples/room/room.glb', this.gl, this.lighting, this.root)
    
    this.lightmapChunk = new LightmapChunk()
    this.lightmapChunk.lightmapExposure.attachConstant(1.2)
    this.lightmapChunk.iblCutoffMult   .attachConstant(1.2)
    this.lightmapChunk.iblCutoffOffset .attachConstant(.75)
    
    /**
     * add lightmap chunk to every metrials
     */
    this.gltfSample.overrides.overridePass("", (ctx, material)=>{
      material.inputs.add( this.lightmapChunk )
      return null
    })
    
    
    const f = gui.folder('box projection')
    f.range( this.lighting.ibl.boxProjectionSize, '0', 0, 4 ).setLabel('size x')
    f.range( this.lighting.ibl.boxProjectionSize, '1', 0, 4 ).setLabel('size y')
    f.range( this.lighting.ibl.boxProjectionSize, '2', 0, 4 ).setLabel('size z')
    
    f.range( this.lighting.ibl, 'x', -1, 1 ).setLabel('origin x')
    f.range( this.lighting.ibl, 'y', 0, 3 ).setLabel('origin y')
    f.range( this.lighting.ibl, 'z', -1, 1 ).setLabel('origin z')
    
    
    CreateGui( this.lightmapChunk );

  }



  preRender(): void {
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
    this.lighting.lightSetup.prepare(this.gl);
  }

  
  render(context: RenderContext): void {
    this.gltfSample.render(context)
  }
  
  async load(): Promise<void> {
    await this.loadLighting()
    await this.gltfSample.load()
    await this.loadLightmap()
  }

  loadLighting() {
    this.lighting.ibl.load(
      require( "@/assets/webgl/samples/room/env/env.png").default,
      require( "@/assets/webgl/samples/room/env/sh.bin").default
    )
  }

  async loadLightmap(){
    // const lightmap = AssetDatabase.getTexture( 'samples/room/lightmap.jpg', this.gl )
    const lightmap = AssetDatabase.getTexture( 'samples/room/lightmap_hdr.png', this.gl, {alpha:true} )
    await lightmap.load()
    const tc = TexCoord.create('aTexCoord1')
    this.lightmapChunk.lightmapInput.attachSampler('basecolor', tc ).set( lightmap.texture )
  }
  
  unload(): void {
    DeleteGui( this.lightmapChunk )
    gui.clearFolder('box projection')
  }
  
  rttPass(): void {0}
}