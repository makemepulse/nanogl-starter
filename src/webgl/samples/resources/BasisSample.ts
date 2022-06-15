import Renderer from "@webgl/Renderer"
import { GLContext } from "nanogl/types"
import { IScene } from "@webgl/engine/IScene"
import WebglAssets from "@webgl/resources/WebglAssets"
import Texture2D from "nanogl/texture-2d"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import { loadBytes } from "@webgl/resources/Net"
import BasisDecoder from "@webgl/resources/basis/BasisDecoder"

export default class BasisSample implements IScene {

  readonly gl: GLContext
  tex: Texture2D


  constructor(private renderer: Renderer) {

    this.gl = renderer.gl
    
    this.tex = new Texture2D(this.gl)
    
  }
  
  
  
  render(): void {
    DebugDraw.drawTexture('basis tex', this.tex)
  }
  
  async load(): Promise<void> {
    const url = WebglAssets.getAssetPath('sample/matcap_clay.jpg.basis.ktx2')
    const buffer = await loadBytes(url)
    const decoder = new BasisDecoder()
    const res = await decoder.decode(this.gl, buffer)
    decoder.setupTexture( res, this.tex )
    console.log( res )
  }
  


  preRender(): void {0}
  rttPass(): void {0}
  unload(): void {0}

}