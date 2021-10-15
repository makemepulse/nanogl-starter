
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';


export default class Asset implements IElement {

  readonly gltftype : GltfTypes.ASSET = GltfTypes.ASSET;

  name        : undefined | string;
  extras      : any   ;

  version    : string;
  copyright? : string;
  generator? : string;
  minVersion?: string;

  parse( gltfLoader:GltfLoader, data: Gltf2.IAsset ) : Promise<any> {

    this.version    = data.version;
    this.copyright  = data.copyright;
    this.generator  = data.generator;
    this.minVersion = data.minVersion;

    return Promise.resolve();
  }

}

