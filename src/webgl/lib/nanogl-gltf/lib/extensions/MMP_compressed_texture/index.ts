import { IExtensionInstance, IExtensionFactory } from "../IExtension";
import Gltf2 from "../../types/Gltf2";
import { ElementOfType, PropertyType, AnyElement } from "../../types/Elements";
import GltfLoader from "../../io/GltfLoader";
import GltfTypes from "../../types/GltfTypes";
import Image from "../../elements/Image";
import CompressedImage from "./CompressedImage";
import TextureLoader from "./TextureLoader";

/**
 * Load ktx textures into image
 * Resolve the compressed supported type
 */

const EXT_ID = 'MMP_compressed_texture';

class Instance implements IExtensionInstance {

  readonly name: string = EXT_ID;
  readonly priority: number = 1;

  loader: GltfLoader;
  textureLoader: TextureLoader;

  constructor(gltfLoader: GltfLoader) {
    this.loader = gltfLoader;
    this.textureLoader = new TextureLoader();
  }

  acceptElement<P extends Gltf2.Property>(data: P, element: ElementOfType<PropertyType<P>>): null | Promise<ElementOfType<PropertyType<P>>>;

  async acceptElement(data: Gltf2.Property, element: Image): null | Promise<Image> {

    return element;

  }

  loadElement<P extends Gltf2.Property>(data: P): Promise<ElementOfType<PropertyType<P>>>;
  loadElement(data: Gltf2.Property): Promise<AnyElement> {

    // TODO :
    // Move to extenstion not extras
    let hasCompressed = data.gltftype === GltfTypes.IMAGE && data.extras && data.extras.MMP_compressed_texture;
    hasCompressed = hasCompressed && this.textureLoader.hasCodec();
    if (!hasCompressed)
      return null;

    const comp = new CompressedImage();
    return comp.parseCompressed(this.loader, data as Gltf2.IImage, this.textureLoader).then(() => comp);

  }

}


export default class MMP_compressed_texture implements IExtensionFactory {
  readonly name: string = EXT_ID;
  createInstance(gltfLoader: GltfLoader): IExtensionInstance {
    return new Instance(gltfLoader);
  }
}