import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"

const GltfPath = "samples/suzanne/suzanne.gltf"

export default class SimpleGltfSample implements IScene {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  
  constructor( renderer:Renderer ){
    this.gl = renderer.gl
    this.lighting   = new Lighting( this.gl )
    this.gltfSample = new GltfScene( GltfPath, this.gl, this.lighting )
  }

  preRender():void {
    this.gltfSample.preRender()
    this.lighting.root.updateWorldMatrix()
  }

  rttPass():void {
    this.lighting.lightSetup.prepare(this.gl);
  }

  render( context: RenderContext ):void {
    this.gltfSample.render( context )
  }

  async load() :Promise<void> {
    await this.lighting.load()
    await this.gltfSample.load()
  }

  unload(): void {
    this.lighting.dispose()
    this.gltfSample.unload()
  }

}