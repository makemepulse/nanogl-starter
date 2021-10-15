


import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';


const GL_REPEAT = 10497;


export default class Sampler implements IElement {

  readonly gltftype : GltfTypes.SAMPLER = GltfTypes.SAMPLER;

  name        : undefined | string;
  extras      : any   ;
  
  magFilter?: GLenum;
  minFilter?: GLenum;
  wrapS     : GLenum;
  wrapT     : GLenum

  parse( gltfLoader:GltfLoader, data: Gltf2.ISampler ): Promise<any>{

    this.magFilter = data.magFilter
    this.minFilter = data.minFilter
    this.wrapS     = data.wrapS     ?? GL_REPEAT
    this.wrapT     = data.wrapT     ?? GL_REPEAT

    return Promise.resolve()

  }

}

