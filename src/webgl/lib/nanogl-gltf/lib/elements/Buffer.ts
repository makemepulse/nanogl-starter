

import Gltf from '../index'
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import Assert from '../lib/assert';
import { IElement } from '../types/Elements';


export default class Buffer implements IElement {

  readonly gltftype : GltfTypes.BUFFER = GltfTypes.BUFFER;

  name        : undefined | string;
  extras      : any   ;
  
  byteLength  :number       ;
  uri         : string      ;
  _bytes      : ArrayBuffer;
  _byteOffset :number       ;

  async parse( gltfLoader : GltfLoader, data : Gltf2.IBuffer ) : Promise<any> {
    
    this.byteLength  = data.byteLength;
    this.uri         = data.uri;

    this._byteOffset = 0;

    this._bytes      = await gltfLoader.loadBufferUri( data.uri );
    Assert.isTrue( this._bytes !== null )
  }

  

}

