import Renderer from "@webgl/Renderer"
import { IScene } from "@webgl/engine/IScene"
import AssetDatabase from "@webgl/resources/AssetDatabase"
import { Resource } from "@webgl/resources/Resource"
import { TexturedQuad } from "../common/TexturedQuad"
import { RenderContext } from "@webgl/core/Renderer"

/**
 * minimal example of TextureResource  loading
 */
export default class MinimalResourceSample implements IScene {

  resource: Resource

  constructor(private renderer: Renderer) {
    this.resource = AssetDatabase.getTexture('samples/textures/matcap_white.jpg', this.renderer.gl)
  }
  
  load(): Promise<void> {
    return this.resource.load()
  }
  
  unload   (): void {
    this.resource.unload()
  }
  
  render( ctx:RenderContext ): void {
    TexturedQuad.renderQuad(ctx, this.resource.value)
  }



  preRender(): void {0}
  rttPass  (): void {0}

}