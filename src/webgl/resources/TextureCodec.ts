
import TextureExtensions from "./TextureExtensions";
import { ITextureRequest, ITextureRequestSource } from "./TextureRequest";


export interface ITextureCodec {

  name : string;
  isSupported( extensions : TextureExtensions ) : Promise<boolean>;
  // createTextureData( textureResource : BaseTextureResource, source : ITextureRequestSource ) : TextureData;
  decodeLod( source : ITextureRequestSource, lod:number, extensions: TextureExtensions ) : Promise<void>;
  decodeCube(source : ITextureRequestSource, extensions: TextureExtensions ): Promise<void>;

}




export class TextureCodecs {

  private static _codecs : Record<string, ITextureCodec> = {};

  static registerCodec( codec : ITextureCodec ) : void {
    if( this._codecs[codec.name] !== undefined ){
      console.warn( `TextureCodec.registerCodec() Codec ${codec.name} already exist` );
      return;
    }
    this._codecs[codec.name] = codec;
  }

  
  static async getCodecForRequest( request : ITextureRequest, extensions: TextureExtensions ) : Promise<[ITextureCodec,ITextureRequestSource]  | null> {
    const sources = request.sources;
    for (const source of sources ) {
      const codec = this._codecs[source.codec];
      if( codec !== undefined  ) {
        const isSupported = await codec.isSupported( extensions )
        if( isSupported ){
          return [codec, source];
        }
      }
    }
    return null;
  }
}


