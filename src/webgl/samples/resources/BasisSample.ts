import Renderer from "@webgl/Renderer"
import { GLContext } from "nanogl/types"
import { IScene } from "@webgl/engine/IScene"
import AssetDatabase from "@webgl/resources/AssetDatabase"
import Texture2D from "nanogl/texture-2d"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import { loadBytes } from "@webgl/resources/Net"
import BasisDecoder from "@webgl/resources/basis/BasisDecoder"

/**
 * Illustrate raw decoding of basis files
 * Basis can also be used with TextureResource
 * @see TextureResource
 */
export default class BasisSample implements IScene {

  readonly gl: GLContext
  tex: Texture2D


  constructor(private renderer: Renderer) {
    this.gl = renderer.gl
    this.tex = new Texture2D(this.gl)
  }
  
  
  async load(): Promise<void> {
    const url = AssetDatabase.getAssetPath('samples/textures/matcap_clay.jpg.basis.ktx2')
    const buffer = await loadBytes(url)
    const res = await BasisDecoder.getInstance().decode(this.gl, buffer)
    BasisDecoder.setupTexture( res, this.tex )
  }
  
  
  render(): void {
    DebugDraw.drawTexture('basis tex', this.tex)
  }



  preRender(): void {0}
  rttPass  (): void {0}
  unload   (): void {0}

}