import Renderer from "@webgl/Renderer"
import ResourceGroup from "@webgl/resources/ResourceGroup"
import { TextureResource } from "@webgl/resources/TextureResource"
import AssetDatabase from "@webgl/resources/AssetDatabase"
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
    const gl = renderer.gl
    this.resources.add(new GltfScene("samples/suzanne/suzanne.gltf", gl), 'suzanne')
    this.resources.add(this.textures)

    this.textures.add( new TextureResource(AssetDatabase.getAssetPath("samples/suzanne/albedo.png"), gl), 'suzanne_color' )
    this.textures.add( new TextureResource(AssetDatabase.getAssetPath("samples/suzanne/roughness.png"), gl), 'suzanne_mr' )
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
    console.log( this.resources.get('suzanne') )
  }

  render(): void {
    DebugDraw.drawTexture( 'suzanne_color', this.textures.get('suzanne_color') )
  }

  preRender(): void {0;}
  rttPass(): void {0;}
}