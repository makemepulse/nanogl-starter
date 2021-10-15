import { IExtensionInstance, IExtensionFactory } from "../IExtension";
import Gltf2 from "../../types/Gltf2";
import { ElementOfType, PropertyType, AnyElement } from "../../types/Elements";
import GltfLoader from "../../io/GltfLoader";


/**
 * this extension actually do nothing
 * vanilla parser already support arbitrary attributes type and normalization
 */

const EXT_ID  = 'KHR_mesh_quantization';

class Instance implements IExtensionInstance {
  readonly name: string = EXT_ID;
  readonly priority: number = -10;
  acceptElement<P extends Gltf2.Property>(data: P, element: ElementOfType<PropertyType<P>> ) : null | Promise<ElementOfType<PropertyType<P>>> {
    return null;
  }
  loadElement<P extends Gltf2.Property>(data: P): Promise<ElementOfType<PropertyType<P>>>;
  loadElement(data: Gltf2.Property): Promise<AnyElement> {
    return null;
  }
}


export default class KHR_texture_transform implements IExtensionFactory {
  readonly name: string = EXT_ID;
  createInstance(gltfLoader: GltfLoader): IExtensionInstance {
    return new Instance();
  }
}