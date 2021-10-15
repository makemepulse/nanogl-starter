import { IExtensionInstance, IExtensionFactory } from "../IExtension";
import Gltf2 from "../../types/Gltf2";
import { ElementOfType, PropertyType, AnyElement } from "../../types/Elements";
import GltfLoader from "../../io/GltfLoader";
import GltfTypes from "../../types/GltfTypes";
import { webpSupport } from "./webpSupport";


/**
 * this extension actually do nothing
 * vanilla parser already support arbitrary attributes type and normalization
 */

const EXT_ID  = 'EXT_texture_webp';

class Instance implements IExtensionInstance {

  readonly name: string = EXT_ID;
  readonly priority: number = -10;
   
  loader: GltfLoader;

  constructor( gltfLoader : GltfLoader) {
    this.loader = gltfLoader;
  }

  acceptElement<P extends Gltf2.Property>(data: P, element: ElementOfType<PropertyType<P>> ) : null | Promise<ElementOfType<PropertyType<P>>>;
  
  async acceptElement(data: Gltf2.Property, element: AnyElement ) : null | Promise<AnyElement> {
    
    if( element.gltftype === GltfTypes.TEXTURE && data.extensions && data.extensions[EXT_ID] ){
     
      const webpSupported = await webpSupport();
      if( webpSupported ){
        element.source = await this.loader.getElement( GltfTypes.IMAGE, data.extensions[EXT_ID].source );
      }

    }

    return element;
  }
  
  loadElement<P extends Gltf2.Property>(data: P): Promise<ElementOfType<PropertyType<P>>>;
  loadElement(data: Gltf2.Property): Promise<AnyElement> {
    return null;
  }
}


export default class KHR_texture_transform implements IExtensionFactory {
  readonly name: string = EXT_ID;
  createInstance(gltfLoader: GltfLoader): IExtensionInstance {
    return new Instance(gltfLoader);
  }
}