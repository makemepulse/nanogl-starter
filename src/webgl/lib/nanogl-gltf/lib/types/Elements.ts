import Accessor             from "../elements/Accessor"             ;
import Asset                from "../elements/Asset";
import Buffer               from "../elements/Buffer"               ;
import BufferView           from "../elements/BufferView"           ;
import Camera               from "../elements/Camera"               ;
import { IMaterial }             from "../elements/Material"             ;
import Mesh                 from "../elements/Mesh"                 ;
import Primitive            from "../elements/Primitive"            ;
import Skin                 from "../elements/Skin"                 ;
import Animation            from "../elements/Animation"     ;
import AnimationChannel     from "../elements/AnimationChannel"     ;
import AnimationSampler     from "../elements/AnimationSampler"     ;
import NormalTextureInfo    from "../elements/NormalTextureInfo"    ;
import OcclusionTextureInfo from "../elements/OcclusionTextureInfo" ;
import Sampler              from "../elements/Sampler"              ;
import Scene                from "../elements/Scene"                ;
import Texture              from "../elements/Texture"              ;
import TextureInfo          from "../elements/TextureInfo"          ;
import Image                from "../elements/Image";
import Node                 from "../elements/Node";

import Gltf2 from "./Gltf2";
import GltfTypes from "./GltfTypes";
import AccessorSparse from "../elements/AccessorSparse";
import AccessorSparseIndices from "../elements/AccessorSparseIndices";
import AccessorSparseValues from "../elements/AccessorSparseValues";
import GltfLoader from "../io/GltfLoader";
import { GLContext } from "nanogl/types";



export interface IElement {
  
  readonly gltftype : GltfTypes
  name        : undefined | string
  extras      : any   
  
  parse( gltfLoader : GltfLoader, data : Gltf2.IProperty ) : Promise<any>
  
}






export type AnyElement = 
  Accessor              |
  AccessorSparse        |
  AccessorSparseIndices |
  AccessorSparseValues  |
  Animation             |
  AnimationChannel      |
  AnimationSampler      |
  Asset                 |
  Buffer                |
  BufferView            |
  Camera                |
  Image                 |
  IMaterial             |
  Mesh                  |
  Node                  |
  NormalTextureInfo     |
  OcclusionTextureInfo  |
  Primitive             |
  Sampler               |
  Scene                 |
  Skin                  |
  Texture               |
  TextureInfo           ;
  
  // PbrMetallicRoughness  |
  


export type ElementOfType<T extends GltfTypes, E extends AnyElement = AnyElement> = E extends { gltftype : T } ? E : never;
export type PropertyOfType<T extends GltfTypes, E extends Gltf2.Property = Gltf2.Property> = E extends { gltftype : T } ? E : never;


export type PropertyType<T extends Gltf2.Property> = T extends { gltftype : infer E } ? E : never;
export type ElementType<T extends AnyElement> = T extends { gltftype : infer E } ? E : never;


export type ElementForProperty        <T extends Gltf2.Property> = ElementOfType<PropertyType<T>>
export type PromiseElementForProperty <T extends Gltf2.Property> = Promise<ElementOfType<PropertyType<T>>>

