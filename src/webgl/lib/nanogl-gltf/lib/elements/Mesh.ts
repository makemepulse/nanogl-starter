
import Primitive from './Primitive';

import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';

export default class Mesh implements IElement {
  
  readonly gltftype : GltfTypes.MESH = GltfTypes.MESH;
  name        : undefined | string;
  extras      : any   ;

  primitives : Primitive[];
  weights?   : Float32Array;
  
  async parse( gltfLoader:GltfLoader, data: Gltf2.IMesh ) : Promise<any>{
    
    const primPromises = data.primitives.map( (data)=>gltfLoader._loadElement(data) );
    this.primitives = await Promise.all( primPromises );
    
    if( data.weights ){
      this.weights = new Float32Array( data.weights );
    }
    
  }

}

