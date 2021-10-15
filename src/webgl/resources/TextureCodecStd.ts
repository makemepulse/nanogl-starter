import { ITextureCodec } from "./TextureCodec";
import { ITextureRequestSource } from "./TextureRequest";
import { TextureType } from "nanogl/texture-base";
import Deferred from "@/core/Deferred";
import { TextureDataType, TextureMip } from "./TextureData";


const _HAS_CIB : boolean = (navigator.userAgent.indexOf("Chrome") !== -1) && ( window.createImageBitmap !== undefined );

function getImageType( bytes:ArrayBuffer ){
  const H = new Uint32Array( bytes, 0, 2 );
  if( H[0] === 0x474e5089 ){
    return 'image/png';
  }
  return 'image/jpeg'
}





export default class TextureCodecStd implements ITextureCodec {
  
  name = 'std';

  isPNG: boolean;

  decodeImage( bytes:ArrayBuffer ) : Promise<HTMLImageElement|ImageBitmap> {
    const imageType : string = getImageType(bytes);
    this.isPNG = imageType == 'image/png' ? true : false;
    return TextureCodecStd.decodeImage(bytes, imageType)
  }
  
  static decodeImage( bytes:ArrayBuffer, mime?: string  ) : Promise<HTMLImageElement|ImageBitmap> {

    if( mime == undefined ){
      mime = getImageType(bytes);
    }

    const blob = new Blob( [bytes] , { type: mime });
    
    if( _HAS_CIB )
    {
      return createImageBitmap( blob, {premultiplyAlpha:'none'} );
    } else 
    {
      
      const def = new Deferred();
      const src = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload  = def.resolve;
      img.onerror = def.reject;
      img.src = src;
      
      def.promise.finally( ()=>URL.revokeObjectURL(src) )

      return def.promise.then( ()=>img );

    }

  }





  async decodeLod(source: ITextureRequestSource, lod: number): Promise<void> {


    const requestLod = source.lods[lod];

    const image = await this.decodeImage( requestLod.buffers[0] );

    const mip : TextureMip<TexImageSource> = {
      width  : image.width,
      height : image.height,
      data : image
    }

    const fmt = this.isPNG ? 0x1908 : 0x1907;

    source.datas = {
      
      datatype       : TextureDataType.IMAGE ,
      format         : fmt                   , // RGB || RGBA
      internalformat : fmt                   , // RGB || RGBA
      type           : 0x1401                , // unsigned byte
      textureType    : TextureType.TEXTURE_2D,
      width          : image.width           ,
      height         : image.height          ,

      sources : [{
        surfaces : [[mip]]
      }]
    } 


  }


  async decodeCube(source: ITextureRequestSource) : Promise<void>{


    source.datas = {
      
      datatype       : TextureDataType.IMAGE ,
      format         : 0x1907                , // RGB
      internalformat : 0x1907                , // RGB
      type           : 0x1401                , // unsigned byte
      textureType    : TextureType.TEXTURE_CUBE,
      width          : 1024                  ,
      height         : 1024                  ,

      sources : [{
        surfaces : []
      }]
    } 

    for(let i = 0; i < 6; i++){
  
      const requestLod = source.lods[i];
  
      const image = await this.decodeImage( requestLod.buffers[0] );
  
      const mip : TextureMip<TexImageSource> = {
        width  : image.width,
        height : image.height,
        data : image
      }

      source.datas.sources[0].surfaces.push([mip]);
      
    }

  }


  isSupported(): Promise<boolean> {
    return Promise.resolve(true);
  }
  
}




import { webpSupport } from "@webgl/lib/nanogl-gltf/lib/extensions/EXT_texture_webp/webpSupport";

export class TextureCodecWebp extends TextureCodecStd implements ITextureCodec {
  

  name: 'webp' = 'webp';

  isSupported(): Promise<boolean> {
    return webpSupport()
  }
}
