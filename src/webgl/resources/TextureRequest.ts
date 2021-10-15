import TextureData from "./TextureData";


export enum TextureWrap {
  CLAMP,
  REPEAT,
  MIRROR,
}

export enum TextureFiltering {
  NEAREST                        = 0x2600,
  LINEAR                         = 0x2601,
  NEAREST_MIPMAP_NEAREST         = 0x2700,
  LINEAR_MIPMAP_NEAREST          = 0x2701,
  NEAREST_MIPMAP_LINEAR          = 0x2702,
  LINEAR_MIPMAP_LINEAR           = 0x2703,
}


export interface ITextureRequestOptions {
  bbc       : boolean
  flipY     : boolean
  genMips   : boolean
  wrap      : TextureWrap
  filtering : TextureFiltering
}



export interface ITextureRequestLod {
  files : string[],
  buffers : ArrayBuffer[],
}

export interface ITextureRequestSource {
  codec : string
  lods : ITextureRequestLod[],
  datas : TextureData | null
}


export interface ITextureRequest {
  options : ITextureRequestOptions;
  sources : ITextureRequestSource[];
}


export class TextureSrcSet implements ITextureRequest {

  options: ITextureRequestOptions;
  sources: ITextureRequestSource[];

  static create( path:string, bbc = false ) : TextureSrcSet {

    const sources: [string, string][] = [
      ['webp',  `${path}.webp`    ],
      ['std' ,  path ]
    ] 

    if( bbc ){
      sources.unshift(
        ['astc' ,  `${path}.astc.ktx` ],
        ['dxt' ,  `${path}.dxt.ktx` ],
        ['etc' ,  `${path}.etc.ktx` ],
        ['pvr' ,  `${path}.pvr.ktx` ],
      )
    }

    return new TextureSrcSet( sources )
  }

  constructor( sources : string | [string, string][] ){

    if( typeof sources === 'string' ){
      sources = [ ['std', sources]]
    } 

    this.sources = []
    for (const codec of sources) {
      const url = codec[1];
      this.sources.push( {
        codec: codec[0],
        lods : [{files:[url], buffers:null}],
        datas : null
      });
    }
  }

}


export class CubeSrcSet implements ITextureRequest {

  options: ITextureRequestOptions;
  sources: ITextureRequestSource[];

  constructor( sources : Record<string, Array<string>> ){

    this.sources = []
    for (const codec in sources) {

      const lods = [];
      for(let i = 0; i < sources[codec].length; i++){
        lods.push(
          {
            files: [sources[codec][i]],
            buffers: null
          }
        );
      }

      this.sources.push( {
        codec,
        lods : lods,
        datas : null
      });

    }

  }


}