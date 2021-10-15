import IRenderer from "@webgl/core/IRenderer";
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw";
import { TextureSrcSet } from "@webgl/resources/TextureRequest";
import { TextureResource } from "@webgl/resources/TextureResource";

export default class TestDebugDraw{

  textures: TextureResource[]
  ready: boolean;

  constructor( private renderer : IRenderer ){

    this.textures = []

    for (let index = 0; index < 4; index++) {
      const texRes = new TextureResource( new TextureSrcSet( 'https://picsum.photos/512/512' ), renderer )
      this.textures.push( texRes )
    }

    this.load()

  }

  async load() : Promise<void>{
    await Promise.all( this.textures.map( t=>t.load() ) )
    this.ready =true
  }

  render(): void {
    if( ! this.ready ) return
    let x = 0
    for (let i = 0; i < this.textures.length; i++) {
      const tex = this.textures[i].texture;
      DebugDraw.drawTexture( tex, x )   
      x += tex.width
    }
  }
}