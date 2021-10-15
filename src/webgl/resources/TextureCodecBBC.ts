import { ITextureCodec } from "./TextureCodec";
import TextureExtensions from "./TextureExtensions";
import { ITextureRequestSource } from "./TextureRequest";
import KTXParser from "./KTXParser";
import TextureData, { TextureDataType, TextureMip } from "./TextureData";
import { TextureType } from "nanogl/texture-base";

export abstract class TextureCodecBBC implements ITextureCodec {

  name: string;
  parser: KTXParser;

  constructor() {
    this.parser = new KTXParser();
  }

  abstract isSupported(extensions: TextureExtensions): Promise<boolean>;

  decodeLod(source: ITextureRequestSource, lod: number): Promise<void> {

    const requestLod = source.lods[lod];
    const image = this.parser.parse(requestLod.buffers[0]);
    const mips: TextureMip<ArrayBufferView>[] = image.surfaces[0].map(l => {
      return {
        width: image.width,
        height: image.height,
        data: l
      }
    });

    const datas: TextureData = {

      datatype: TextureDataType.RAW_COMPRESSED,
      textureType: TextureType.TEXTURE_2D,
      width: image.width,
      height: image.height,
      internalformat: image.internalFormat,
      format: image.format,
      type: image.type,

      sources: [{
        surfaces: [mips]
      }]
    }

    source.datas = datas;
    return null;

  }

  decodeCube():Promise<void> {
    throw new Error("Method not implemented.");
  }

}



export class TextureCodecDxt extends TextureCodecBBC {
  name: 'dxt' = 'dxt';
  isSupported(extensions: TextureExtensions): Promise<boolean> {
    return Promise.resolve(extensions.dxt != null);
  }
}


export class TextureCodecEtc extends TextureCodecBBC {
  name: 'etc' = 'etc';
  isSupported(extensions: TextureExtensions): Promise<boolean> {
    return Promise.resolve(extensions.etc != null);
  }
}


export class TextureCodecPvr extends TextureCodecBBC {
  name: 'pvr' = 'pvr';
  isSupported(extensions: TextureExtensions): Promise<boolean> {
    return Promise.resolve(extensions.pvr != null);
  }
}