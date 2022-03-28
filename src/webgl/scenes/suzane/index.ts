import { AssetsPath } from "@/core/PublicPath"
import { RenderContext } from "@webgl/core/Renderer"
import { IGLContextProvider } from "@webgl/resources/IGLContextProvider"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "../GltfScene"
import { IScene } from "../IScene"
import Lighting from "../Lighting"


export default class SuzanneScene implements IGLContextProvider, IScene {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  root       : Node
  
  constructor( gl : GLContext ){
    this.gl = gl
    this.root       = new Node()
    this.lighting   = new Lighting( this.gl )
    this.root.add( this.lighting.root )
    this.gltfSample = new GltfScene( AssetsPath("webgl/suzanne/Suzanne.gltf"), gl, this.lighting, this.root )
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