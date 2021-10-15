import { GLContext } from 'nanogl/types';
import KTXParser from "./KTXParser";

const DXT_EXTS = [
  'WEBGL_compressed_texture_s3tc',
  'MOZ_WEBGL_compressed_texture_s3tc',
  'WEBKIT_WEBGL_compressed_texture_s3tc',
]

const PVR_EXTS = [
  'WEBGL_compressed_texture_pvrtc',
  'WEBKIT_WEBGL_compressed_texture_pvrtc',
]

const ETC_EXTS = [
  'WEBGL_compressed_texture_etc1',
  'WEBKIT_WEBGL_compressed_texture_etc1',
]

// TODO
// const ASTC_EXTS = [
//   'WEBGL_compressed_texture_astc'
// ]

function pickExtension(gl: GLContext, array: string[]) {
  let ext = null;
  for (const extStr of array) {
    ext = gl.getExtension(extStr);
    if (ext) break;
  }
  return ext;
}


export class TextureCodec {

  parser: KTXParser;
  suffix: string;
  compressed: boolean;
  ext: GLenum;

  constructor(parser: KTXParser, compressed: boolean, suffix: string, extension: number) {

    this.parser = parser;
    this.suffix = suffix;
    this.compressed = compressed;

    this.ext = extension;

  }


  transformPath = (basePath: string) => {
    return basePath + this.suffix;
  }


  isSupported() {
    return !!this.ext || (!this.compressed);
  }

}


export default class TextureLoader {


  DXTCodec: TextureCodec
  PVRCodec: TextureCodec
  ETCCodec: TextureCodec
  // TODO
  // ASTCCodec: TextureCodec

  constructor() {

    let cvs = document.createElement("canvas");
    let gl = <GLContext>(
      cvs.getContext('webgl2', {}) ||
      cvs.getContext('webgl', {}) ||
      cvs.getContext('experimental-webgl', {}) ||
      cvs.getContext('webgl'));

    this.DXTCodec = new TextureCodec(new KTXParser(), true, '.dxt.ktx', pickExtension(gl, DXT_EXTS));
    this.PVRCodec = new TextureCodec(new KTXParser(), true, '.pvr.ktx', pickExtension(gl, PVR_EXTS));
    this.ETCCodec = new TextureCodec(new KTXParser(), true, '.etc.ktx', pickExtension(gl, ETC_EXTS));

    // TODO
    // this.ASTCCodec = new TextureCodec(new KTXParser(), true, '.astc.ktx', pickExtension(gl, ASTC_EXTS));

    const loseExt = gl.getExtension('WEBGL_lose_context');
    if (loseExt) {
      loseExt.loseContext();
    }
    cvs = null;
    gl = null;

  }

  hasCodec() {

    return this.DXTCodec.isSupported() ||
      this.DXTCodec.isSupported() ||
      this.ETCCodec.isSupported()

  }

  getCodec() {

    // TODO
    // if (this.ASTCCodec.isSupported()) {
    //   return this.ASTCCodec
    // }

    if (this.DXTCodec.isSupported()) {
      return this.DXTCodec
    }
    else if (this.PVRCodec.isSupported()) {
      return this.PVRCodec
    }
    else if (this.ETCCodec.isSupported()) {
      return this.ETCCodec
    }

  }


}