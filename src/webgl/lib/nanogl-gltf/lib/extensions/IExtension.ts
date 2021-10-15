// import Accessor             from "../elements/Accessor"             ;
// import AnimationChannel     from "../elements/AnimationChannel"     ;
// import AnimationSampler     from "../elements/AnimationSampler"     ;
// import BufferView           from '../elements/BufferView'           ;
// import Buffer               from '../elements/Buffer'               ;
// import Animation            from '../elements/Animation'            ;
// import Node                 from '../elements/Node'                 ;
// import Material             from '../elements/Material'             ;
// import Mesh                 from '../elements/Mesh'                 ;
// import Skin                 from '../elements/Skin'                 ;
// import Camera               from '../elements/Camera'               ;
// import BaseElement          from '../elements/BaseElement'          ;
// import Image                from '../elements/Image'                ;
// import Asset                from '../elements/Asset'                ;
// import Primitive            from "../elements/Primitive"            ;
// import NormalTextureInfo    from "../elements/NormalTextureInfo"    ;
// import OcclusionTextureInfo from "../elements/OcclusionTextureInfo" ;
// import PbrMetallicRoughness from "../elements/PbrMetallicRoughness" ;
// import Sampler              from "../elements/Sampler"              ;
// import Scene                from "../elements/Scene"                ;
// import Texture              from "../elements/Texture"              ;
// import TextureInfo          from "../elements/TextureInfo"          ;

import GltfLoader from "../io/GltfLoader";
import Gltf2 from "../types/Gltf2";
import { ElementOfType, PropertyType } from "../types/Elements";


export interface IExtensionInstance {
  
  readonly name : string
  readonly priority : number

  loadElement<P extends Gltf2.Property>( data : P ) : null | Promise<ElementOfType<PropertyType<P>>>

  acceptElement<P extends Gltf2.Property>( data : P, element : ElementOfType<PropertyType<P>> ) : Promise<ElementOfType<PropertyType<P>>>
}




export interface IExtensionFactory {
  readonly name : string
  createInstance( gltfLoader : GltfLoader ) : IExtensionInstance
}
