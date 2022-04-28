
import { GLContext } from "nanogl/types";
import { ITextureRequest, ITextureOptions, ITextureRequestSource } from "./TextureRequest";


export interface ITextureCodec {

  name : string;
  isSupported( gl:GLContext ) : Promise<boolean>;
  // createTextureData( textureResource : BaseTextureResource, source : ITextureRequestSource ) : TextureData;
  decodeLod( source : ITextureRequestSource, lod:number, options: ITextureOptions, gl:GLContext ) : Promise<void>;
  decodeCube(source : ITextureRequestSource, options: ITextureOptions, gl:GLContext ): Promise<void>;

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

  
  static async getCodecForRequest( request : ITextureRequest, gl:GLContext ) : Promise<[ITextureCodec,ITextureRequestSource]  | null> {
    const sources = request.sources;
    for (const source of sources ) {
      const codec = this._codecs[source.codec];
      if( codec !== undefined  ) {
        const isSupported = await codec.isSupported( gl )
        if( isSupported ){
          return [codec, source];
        }
      }
    }
    return null;
  }
}


