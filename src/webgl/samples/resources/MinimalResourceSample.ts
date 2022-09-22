import Renderer from "@webgl/Renderer"
import { IScene } from "@webgl/engine/IScene"
import AssetDatabase from "@webgl/resources/AssetDatabase"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import { Resource } from "@webgl/resources/Resource"

/**
 * minimal example
 * @see TextureResource
 */
export default class MinimalResourceSample implements IScene {

  resource: Resource

  constructor(private renderer: Renderer) {
    this.resource = AssetDatabase.getTexture('sample/matcap_white.jpg', this.renderer.gl)
  }
  
  load(): Promise<void> {
    return this.resource.load()
  }
  
  unload   (): void {
    this.resource.unload()
  }
  
  render(): void {
    DebugDraw.drawTexture('texture', this.resource.value)
  }



  preRender(): void {0}
  rttPass  (): void {0}

}