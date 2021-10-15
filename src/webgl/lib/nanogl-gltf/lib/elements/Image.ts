


import BufferView from './BufferView';
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';
import { AbortSignalLike } from '@azure/abort-controller';
import { createNativeSignal } from '../lib/cancellation';
import Texture2D from 'nanogl/texture-2d';
import { GLContext } from 'nanogl/types';


const _HAS_CIB: boolean = (window.createImageBitmap !== undefined);

const GL_REPEAT                         = 0x2901;
const GL_MIRRORED_REPEAT                = 0x8370;

export function filterHasMipmap(filter : GLenum) : boolean {
  return (filter & (1 << 8)) === (1 << 8);
}

export function wrapRequirePot(wrap : GLenum ) : boolean {
  return wrap === GL_REPEAT || wrap === GL_MIRRORED_REPEAT;
}

export function isPowerOf2(n : number ) : boolean {
  return (n != 0 && (n & (n-1)) === 0);
}

function nearestPowerOf2(n:number) : number {
    if( isPowerOf2(n) ) return n;
    if (n % 2 === 1) n++;
    return Math.pow(2.0, Math.round(Math.log(n) / Math.log(2.0)));
}




export default class Image implements IElement {

  readonly gltftype: GltfTypes.IMAGE = GltfTypes.IMAGE;

  name: undefined | string;
  extras: any;

  uri?: string;
  resolvedUri?: string;
  mimeType?: Gltf2.ImageMimeType;
  bufferView?: BufferView;

  texImageSource: TexImageSource;

  async parse(gltfLoader: GltfLoader, data: Gltf2.IImage): Promise<any> {

    if (data.uri) {
      this.uri = data.uri;

      if (this.uri.indexOf('data:') == 0) {
        this.resolvedUri = this.uri;
      } else {
        this.resolvedUri = gltfLoader.resolveUri(this.uri);
      }
    }



    this.mimeType = data.mimeType;

    if (data.bufferView !== undefined) {
      this.bufferView = await gltfLoader.getElement(GltfTypes.BUFFERVIEW, data.bufferView);
    }



    const blob = await this.loadImageBlob(gltfLoader.abortSignal);
    this.texImageSource = await gltfLoader.gltfIO.loadImageBlob(blob, gltfLoader.abortSignal);

  }

  protected async loadImageBlob(abortSignal: AbortSignalLike): Promise<Blob> {

    if (this.bufferView) {
      // mimeType is guaranted here
      const arrayView = new Uint8Array(
        this.bufferView.buffer._bytes,
        this.bufferView.getByteOffset(),
        this.bufferView.byteLength
      );
      return new Blob([arrayView], { type: this.mimeType });
    } else {
      // assume uri is defained as uri or data uri
      const signal = createNativeSignal(abortSignal)
      const request = await fetch(this.resolvedUri, { signal })
      const blob = await request.blob();
      return blob;
    }

  }

  public async setupTexture(texture: Texture2D, wrapS : GLenum, wrapT : GLenum, minFilter : GLenum, magFilter: GLenum): Promise<void> {

    const gl = texture.gl;

   let texImageSource = this.texImageSource;
   if( wrapRequirePot(wrapS) || wrapRequirePot( wrapT ) || filterHasMipmap(minFilter) ){
     if( !isPowerOf2(texImageSource.width) || !isPowerOf2(texImageSource.height) )
     texImageSource = await this.resizeToPOT( texImageSource, gl );
    }

    texture.fromImage(this.texImageSource);

    if( filterHasMipmap(minFilter) ){
      gl.generateMipmap( gl.TEXTURE_2D );
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);


  }

  async resizeToPOT( source: TexImageSource, gl : GLContext ) : Promise<TexImageSource> {

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width  = nearestPowerOf2( source.width );
    canvas.height = nearestPowerOf2( source.height );
    
    if( source instanceof ImageData ){
      const imageBitmap = await  createImageBitmap( source, 0, 0, canvas.width, canvas.height );
      context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
    } else {
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
    }

    return canvas;

  }



}

