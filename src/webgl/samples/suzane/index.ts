import { AssetsPath } from "@/core/PublicPath"
import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import { IGLContextProvider } from "@webgl/resources/IGLContextProvider"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"

// const GltfPath = "webgl/suzanne/Suzanne.gltf"
// const GltfPath = "webgl/fn-509_with_tactical_kit/scene.gltf"
const GltfPath = "webgl/ground_control_station_for_uav/scene.gltf"

export default class SuzanneScene implements IGLContextProvider, IScene {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  root       : Node
  
  constructor( renderer:Renderer ){
    this.gl = renderer.gl
    this.root       = new Node()
    this.lighting   = new Lighting( this.gl )
    this.root.add( this.lighting.root )
    this.gltfSample = new GltfScene( AssetsPath(GltfPath), this.gl, this.lighting, this.root )
  }

  preRender():void {
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
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
  }

}