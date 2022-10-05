import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import Fbo from "nanogl/fbo"
import Viewport from "@webgl/core/Viewport"
import RenderMask from "@webgl/core/RenderMask"
import RenderPass from "@webgl/core/RenderPass"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import GLState from "nanogl-state/GLState"

const GltfPath = "samples/suzanne/suzanne.gltf"

const FBO_SIZE = 512
export default class RttSample implements IScene {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  root       : Node
  fbo: Fbo
  
  constructor( private renderer:Renderer ){
    const gl = this.gl = renderer.gl
    this.root       = new Node()
    this.lighting   = new Lighting( gl )
    this.root.add( this.lighting.root )
    this.gltfSample = new GltfScene( GltfPath, this.gl, this.lighting, this.root )

    this.fbo = new Fbo(gl)
    this.fbo.attachColor(gl.RGB)
    this.fbo.attachDepth()
    this.fbo.resize(FBO_SIZE, FBO_SIZE)

  }

  preRender():void {
    this.gltfSample.gltf.root.rotateY(0.01)
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }

  rttPass():void {
    this.lighting.lightSetup.prepare(this.gl)

    this.fbo.bind()
    this.fbo.defaultViewport()

    GLState.get(this.gl).apply()// ensure depthMask true
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gltfSample.render( {
      gl: this.gl,
      mask: RenderMask.OPAQUE, 
      pass: RenderPass.COLOR,
      camera: this.renderer.camera,
      viewport: Viewport.fromSize(FBO_SIZE, FBO_SIZE)
    })
  }

  render( ):void {
    DebugDraw.drawTexture( 'rtt fbo', this.fbo.getColorTexture(), true )
  }

  async load() :Promise<void> {
    await this.lighting.load()
    await this.gltfSample.load()
  }

  unload(): void {
    this.lighting.dispose()
  }

}