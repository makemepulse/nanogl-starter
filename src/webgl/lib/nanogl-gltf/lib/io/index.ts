import Gltf from "../Gltf";
import IOInterface from "./IOInterface";
import GltfLoader from "./GltfLoader";
import { GltfLoaderOptions } from "./GltfLoaderOptions";






export default class GltfIO {
  
  
  _ioImpl: IOInterface;

  constructor( io : IOInterface ){
    this._ioImpl = io;
  }

   
  loadGltf(path: string, options : GltfLoaderOptions = {} ): Promise<Gltf> {
    const loader = new GltfLoader( this._ioImpl, path, options );
    return loader.load();
  }

}




