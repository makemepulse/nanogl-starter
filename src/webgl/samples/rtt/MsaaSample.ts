import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import Viewport from "@webgl/core/Viewport"
import RenderMask from "@webgl/core/RenderMask"
import RenderPass from "@webgl/core/RenderPass"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import GLState from "nanogl-state/GLState"
import { MsaaFbo } from "@webgl/core/MsaaFbo"
import gui from "@webgl/dev/gui"

const GltfPath = "samples/suzanne/suzanne.gltf"

const FBO_SIZE = 512
export default class MsaaSample implements IScene {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  root       : Node
  msaaFbo    : MsaaFbo

  
  
  constructor( private renderer:Renderer ){
    const gl = this.gl = renderer.gl
    this.root       = new Node()
    this.lighting   = new Lighting( gl )
    this.root.add( this.lighting.root )
    this.gltfSample = new GltfScene( GltfPath, this.gl, this.lighting, this.root )

    this.msaaFbo = new MsaaFbo(gl, false, 4, true)
    this.msaaFbo.setSize(FBO_SIZE, FBO_SIZE)
    
    gui.folder('msaa').select('msaa', [4, 8, 16, 0]).onChange(v=>this.msaaFbo.msaa = v)

    DebugDraw.textureScale = 3
  }

  preRender():void {
    this.gltfSample.gltf.root.rotateY(0.01)
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }

  rttPass():void {
    this.lighting.lightSetup.prepare(this.gl)

    this.msaaFbo.renderFbo.bind()
    this.msaaFbo.renderFbo.defaultViewport()

    GLState.get(this.gl).apply()// ensure depthMask true
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gltfSample.render( {
      gl: this.gl,
      mask: RenderMask.OPAQUE, 
      pass: RenderPass.COLOR,
      camera: this.renderer.camera,
      viewport: Viewport.fromSize(FBO_SIZE, FBO_SIZE)
    })

    this.msaaFbo.blitMsaa()
  }

  render( ):void {
    DebugDraw.drawTexture( 'rtt fbo', this.msaaFbo.getColorTexture(), true )
  }

  async load() :Promise<void> {
    await this.lighting.load()
    await this.gltfSample.load()
  }

  unload(): void {
    DebugDraw.textureScale = 1
    this.lighting.dispose()
  }

}