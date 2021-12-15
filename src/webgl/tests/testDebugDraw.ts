import DebugDraw from "@webgl/dev/debugDraw/DebugDraw";
import { TextureSrcSet } from "@webgl/resources/TextureRequest";
import { TextureResource } from "@webgl/resources/TextureResource";
import WebglAssets from "@webgl/resources/WebglAssets";
import { vec3 } from "gl-matrix";
import { GLContext } from "nanogl/types";

export default class TestDebugDraw{

  textures: TextureResource[]
  ready: boolean;
  texture1: TextureResource;
  texture2: TextureResource;

  constructor( private gl : GLContext ){

    this.textures = []
    this.texture1 = WebglAssets.getTexture( 'texture1', gl )
    this.texture2 = WebglAssets.getTexture( 'texture2', gl )

    for (let index = 0; index < 0; index++) {
      const texRes = new TextureResource( new TextureSrcSet( 'https://picsum.photos/512/512' ), {gl} )
      this.textures.push( texRes )
    }

    this.load()

  }

  async load() : Promise<void>{
    await this.texture1.load()
    await this.texture2.load()
    await Promise.all( this.textures.map( t=>t.load() ) )
    this.ready =true
  }

  render(): void {


    if( ! this.ready ) return

    DebugDraw.drawGuizmo( vec3.create() )
    DebugDraw.drawGuizmo( vec3.fromValues(1, 0, 0) )
    
    DebugDraw.drawTexture( this.texture1.value )   
    DebugDraw.drawTexture( this.texture2.value )   
    let x = 0
    for (let i = 0; i < this.textures.length; i++) {
      const tex = this.textures[i].texture;
      DebugDraw.drawTexture( tex, x )   
      x += tex.width
    }

    // DebugDraw.drawText( 'Hey! Ca va?', vec3.fromValues(0, 0, 0) )
    // DebugDraw.drawText( 'ABCDEFGHIJKLMNOPQRSTU', vec3.fromValues(0, 1, 0) )
    // DebugDraw.drawText( ',:()[]%#@', vec3.fromValues(0, 1.5, 0) )
  }
}