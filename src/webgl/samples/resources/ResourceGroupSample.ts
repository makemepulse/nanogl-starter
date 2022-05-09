import Renderer from "@webgl/Renderer"
import ResourceGroup from "@webgl/resources/ResourceGroup"
import { TextureResource } from "@webgl/resources/TextureResource"
import WebglAssets from "@webgl/resources/WebglAssets"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Texture2D from "nanogl/texture-2d"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"




/**
 * Test resources system and cancelation ability
 * continuously create various types of resources, then load and abort them in mid air
 * to test for memory leaks or error when resources are cancelled during loading
 */
export default class ReourceGroupSample implements IScene {


  resources = new ResourceGroup()
  textures = new ResourceGroup<Texture2D>()


  constructor(renderer: Renderer) {
    this.resources.add(this.textures)

    this.textures.add( new TextureResource(WebglAssets.getAssetPath("gltfs/suzanne/Suzanne_BaseColor.png"), renderer), 'suzanne_color' )
    this.textures.add( new TextureResource(WebglAssets.getAssetPath("gltfs/suzanne/Suzanne_MetallicRoughness.png"), renderer), 'suzanne_mr' )

    this.resources.add(new GltfScene("gltfs/suzanne/Suzanne.gltf", renderer.gl))
  }

  load(): Promise<void> {
    return this.resources.load().then( this.onLoaded )
  }

  unload(): void {
    this.resources.unload()
  }

  onLoaded = ()=>{
    console.log( this.textures.get('suzanne_color') )
    console.log( this.textures.get('suzanne_mr') )
  }

  render(): void {
    DebugDraw.drawTexture( 'suzanne_color', this.textures.get('suzanne_color') )
  }

  preRender(): void {0;}
  rttPass(): void {0;}
}