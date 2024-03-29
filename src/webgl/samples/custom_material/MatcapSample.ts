import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import gui from "@webgl/dev/gui"
import MatcapPass from "./matcap/MatcapPass"
import AssetDatabase from "@webgl/resources/AssetDatabase"

const GltfPath = "samples/suzanne/suzanne.gltf"

/**
 * Illustrate creation of a MaterialPass from scratch
 */
export default class MatcapSample implements IScene {

  readonly gl: GLContext
  gltfSample: GltfScene
  root: Node
  matcapPass: MatcapPass

  constructor(renderer: Renderer) {
    this.gl = renderer.gl
    this.root = new Node()

    
    this.matcapPass = new MatcapPass()


    this.gltfSample = new GltfScene(GltfPath, this.gl, null, this.root)

    /**
     * completely replace the gltf material with les clearcoat one
     */
    this.gltfSample.overrides.overridePass("suzanne_gold", this.matcapPass)
    

    /// #if DEBUG
    const matcaps = AssetDatabase.getAssets().map(a=>a.name).filter( n=>n.startsWith('matcap'))
    gui.folder('Matcap')
      .select('matcap', matcaps ).onChange(v=>this.loadMatcap(v))
    /// #endif
  }



  preRender(): void {
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }

  
  render(context: RenderContext): void {
    this.gltfSample.render(context)
  }
  
  async load(): Promise<void> {
    await this.gltfSample.load()
    await this.loadMatcap('matcap_clay')
  }

  async loadMatcap(name:string){
    const matcap = AssetDatabase.getTexture( name, this.gl )
    await matcap.load()
    this.matcapPass.matcap = matcap.texture
  }
  
  unload(): void {
    gui.clearFolder('Matcap')
  }
  
  rttPass(): void {
    0
  }
}