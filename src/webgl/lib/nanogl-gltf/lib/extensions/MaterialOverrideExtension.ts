import { IExtensionFactory, IExtensionInstance } from "./IExtension";
import GltfLoader from "../io/GltfLoader";
import Gltf2 from "../types/Gltf2";
import { ElementOfType, PropertyType, AnyElement } from "../types/Elements";
import GltfTypes from "../types/GltfTypes";
import { IMaterial } from "../elements/Material";
import BaseMaterial from "nanogl-pbr/BaseMaterial";
import { GLContext } from "nanogl/types";
import Primitive from "../elements/Primitive";
import Node from "../elements/Node";



class OverrideMaterial implements IMaterial {

  readonly gltftype: GltfTypes.MATERIAL = GltfTypes.MATERIAL;
  name: string | undefined;
  extras: any;

  private readonly _material: BaseMaterial;
  
  constructor( material : BaseMaterial ){
    this._material = material;
  }

  createMaterialForPrimitive(gl: GLContext, node: Node, primitive: Primitive ): BaseMaterial {
    return this._material;  
  }

  parse(gltfLoader: GltfLoader, data: Gltf2.IProperty): Promise<any> {
    return null;
  }
  
}



class MaterialOverride implements IExtensionInstance {


  readonly name: string = 'material_override';
  readonly priority: number = 10;
  
  loader: GltfLoader;
  private materials: Record<string, BaseMaterial>;


  constructor( gltfLoader : GltfLoader, materials: Record<string, BaseMaterial>) {
    this.loader = gltfLoader;
    this.materials = materials;
  }


  acceptElement<P extends Gltf2.Property>(data: P, element: ElementOfType<PropertyType<P>> ) : null | Promise<ElementOfType<PropertyType<P>>> {
    return null;
  }
  
  loadElement<P extends Gltf2.Property>(data: P): Promise<ElementOfType<PropertyType<P>>>;

  loadElement(data: Gltf2.Property): Promise<AnyElement> {
    switch (data.gltftype) {
      case GltfTypes.MATERIAL: return this.createMaterial(data);
      default: return null;
    }
  }


  createMaterial(data: Gltf2.IMaterial): Promise<IMaterial> {
    const material = this.materials[data.name];
    if( material !== undefined ){
      const el = new OverrideMaterial( material );
      return Promise.resolve(el);
    }
    return null;
  }


}


export default class MaterialOverrideExtension implements IExtensionFactory {

  readonly name: string = 'material_override';

  overrides: Record<string, BaseMaterial>;

  createInstance(gltfLoader: GltfLoader): IExtensionInstance {
    if( this.overrides === undefined ){
      throw new Error("MaterialOverrideExtension overrides not set");
    }
    return new MaterialOverride(gltfLoader, this.overrides);
  }


}