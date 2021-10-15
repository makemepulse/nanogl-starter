


import Sampler from './Sampler';
import Image from './Image';
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { GLContext } from 'nanogl/types';
import Texture2D from 'nanogl/texture-2d';
import { IElement } from '../types/Elements';
import Deferred from '../lib/Deferred';


export default class Texture implements IElement {

  readonly gltftype : GltfTypes.TEXTURE = GltfTypes.TEXTURE;

  name        : undefined | string;
  extras      : any   ;
  
  sampler:Sampler
  source: Image;
  glTexture : Texture2D;


  private _glTextureDeferred : Deferred<Texture2D> = new Deferred();

  get glTexturePromise() : Promise<Texture2D> {
    return this._glTextureDeferred.promise;
  }



  async parse( gltfLoader:GltfLoader, data: Gltf2.ITexture ){

    if( data.sampler !== undefined ){
      this.sampler = await gltfLoader.getElement( GltfTypes.SAMPLER, data.sampler );
    }

    if( data.source !== undefined ){
      this.source = await gltfLoader.getElement( GltfTypes.IMAGE, data.source );
    }

  }
  
  
  async allocateGl( gl : GLContext ) : Promise<any> {
    
    let glFormat = gl.RGBA;
    if( this.source.mimeType === Gltf2.ImageMimeType.JPEG )
      glFormat = gl.RGBA;



    let minFilter : GLenum = gl.LINEAR
    let magFilter : GLenum = gl.LINEAR

    let wrapS : GLenum = gl.REPEAT
    let wrapT : GLenum = gl.REPEAT

    if( this.sampler ){
      minFilter = this.sampler.minFilter ?? gl.LINEAR
      magFilter = this.sampler.magFilter ?? gl.LINEAR
      wrapS = this.sampler.wrapS
      wrapT = this.sampler.wrapT
    }
    
    this.glTexture = new Texture2D( gl, glFormat, gl.UNSIGNED_BYTE );

    await this.source.setupTexture(this.glTexture, wrapS, wrapT, minFilter, magFilter);

    this.glTexture.bind();

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this._glTextureDeferred.resolve( this.glTexture );

  }
  

}

