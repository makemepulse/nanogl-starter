


import Texture from './Texture';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';
import Gltf from '..';
import { Sampler } from 'nanogl-pbr/Input';
import TexCoord from 'nanogl-pbr/TexCoord';

export interface ITextureInfo {
  texture : Texture
  texCoord: number
  createSampler( id : string ) : Sampler
}

export abstract class BaseTextureInfo implements ITextureInfo {
  
  name        : undefined | string;
  extras      : any   ;

  texture : Texture;
  texCoord: number; 
  
  _sampler: Sampler = null;
  

  createSampler( id : string ) : Sampler {
    if( this._sampler === null ){
      const attrib = Gltf.getSemantics().getAttributeName( `TEXCOORD_${this.texCoord}` )
      this._sampler = new Sampler( `tex_${this.name??''}${id}`, TexCoord.create( attrib ) )
      this.texture.glTexturePromise.then( (t)=> this._sampler.set( t ) )
    }
    return this._sampler;
  }


  async parse( gltfLoader:GltfLoader, data: any ) : Promise<any>{
    this.texture = await gltfLoader.getElement( GltfTypes.TEXTURE, data.index );
    this.texCoord = data.texCoord ?? 0;
  }

}

export default class TextureInfo extends BaseTextureInfo implements IElement, ITextureInfo {
  readonly gltftype : GltfTypes.TEXTURE_INFO = GltfTypes.TEXTURE_INFO;  

}

