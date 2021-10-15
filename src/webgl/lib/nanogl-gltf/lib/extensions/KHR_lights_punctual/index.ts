import { IExtensionFactory, IExtensionInstance } from "../IExtension";
import GltfLoader from "../../io/GltfLoader";
import Gltf2 from "../../types/Gltf2";
import { ElementOfType, PropertyType, AnyElement } from "../../types/Elements";
import { mat3 } from "gl-matrix";
import Light from "nanogl-pbr/lighting/Light";
import DirectionalLight from "nanogl-pbr/lighting/DirectionalLight";
import PointLight from "nanogl-pbr/lighting/PointLight";
import SpotLight from "nanogl-pbr/lighting/SpotLight";
import GltfTypes from "../../types/GltfTypes";
import Node from "../../elements/Node";
import PunctualLight from "nanogl-pbr/lighting/PunctualLight";

const M3 : mat3 = mat3.create()

const EXT_ID  = 'KHR_lights_punctual';



// ===========================================
// Data Spec
// ===========================================

enum IKHR_LP_LightType {
  Directional = 'directional',
  Point       = 'point'      ,
  Spot        = 'spot'       ,
}


interface IKHR_LP_Spot  {

  innerConeAngle?:number; // default 0
  outerConeAngle?:number; // default 0.7853981633974483
  extras?: any;
  extensions?: {
    [key: string]: any;
  };
}

interface IKHR_LP_Light {
  type : IKHR_LP_LightType;

  color    ? : [number,number,number]
  intensity? : number;
  range    ? : number;
  spot     ? : IKHR_LP_Spot

  name? : string;
  extras?: any;
  extensions?: {
    [key: string]: any;
  };
}

interface IKHR_LP_Extension {
  lights : IKHR_LP_Light[];
}



interface IKHR_LP_LightInstance {
  light : number;
  extras?: any;
  extensions?: {
    [key: string]: any;
  };
}

interface LightItemCollection {
  name: string;
  index: number; 
} 

class LightCollection{

  list: Light[];

  _items: Array<LightItemCollection>;
  
  constructor(){
    this.list = [];
    this._items = [];
  }

  addLight(light : Light, name : string = undefined ){

    this.list.push(light);
    this._items.push({name: name, index: this.list.length - 1})
    
  }

  getLightByName(name : string) : Light {
    let out : Light;
    for(let i = 0; i < this._items.length; i++){
      if(this._items[i].name == name){
        out = this.list[this._items[i].index];
        break;
      }
    }
    return out;
  }

  getLightsByName(name : string) : Array<Light> {
    const out : Array<Light> = []
    for(let i = 0; i < this._items.length; i++){
      if(this._items[i].name == name){
        out.push(this.list[this._items[i].index]);
      }
    }
    return out;
  }
  
}


class Instance implements IExtensionInstance {


  readonly name: string = EXT_ID;
  readonly priority: number = 1;
  
  loader: GltfLoader;
  lights: LightCollection;


  constructor( gltfLoader : GltfLoader) {
    this.loader = gltfLoader;
    this.lights = new LightCollection();
    gltfLoader.gltf.extras.lights = this.lights;
  }



  _getLightData( index : number ) : IKHR_LP_Light {
    const lightDatas : IKHR_LP_Extension = this.loader._data.extensions?.[EXT_ID];
    if( lightDatas === undefined ) throw new Error( EXT_ID+' no extension data');
    return lightDatas.lights[index];
  }


  _createDirectional( lightData: IKHR_LP_Light ) : DirectionalLight {
    return new DirectionalLight();
  }

  _createPoint( lightData: IKHR_LP_Light ) : PointLight {
    const l = new PointLight();
    l.radius = lightData.range ?? -1
    return l;
  }

  _createSpot( lightData: IKHR_LP_Light ) : SpotLight {
    const l = new SpotLight();
    l.radius = lightData.range ?? -1
    l.innerAngle = lightData.spot?.innerConeAngle ?? 0
    l.outerAngle = lightData.spot?.outerConeAngle ?? 0
    return l;
  }

  _createLightInstance( lightData: IKHR_LP_Light ) : PunctualLight {
    switch( lightData.type ){
      case IKHR_LP_LightType.Directional : return this._createDirectional( lightData );
      case IKHR_LP_LightType.Point       : return this._createPoint( lightData );
      case IKHR_LP_LightType.Spot        : return this._createSpot( lightData );
    }
  }

  _createLight(node: Node, iData: IKHR_LP_LightInstance) : Light {
    
    const lightData = this._getLightData( iData.light );

    const light : PunctualLight = this._createLightInstance( lightData );

    const color = lightData.color ?? [1, 1, 1]
    const intensity =  lightData.intensity ?? 1

    color[0] *= intensity
    color[1] *= intensity
    color[2] *= intensity

    light._color.set( color )
    node.add( light );

    const name = lightData.name;
    this.lights.addLight(light, name);
    return light;

  }
  
  acceptElement<P extends Gltf2.Property>(data: P, element: ElementOfType<PropertyType<P>> ) : null | Promise<ElementOfType<PropertyType<P>>>;
  acceptElement(data: Gltf2.Property, element: AnyElement ) : null | Promise<AnyElement> {
    if( element.gltftype === GltfTypes.NODE && data.extensions && data.extensions[EXT_ID] ){
      const node : Node = element;
      this._createLight( node, data.extensions[EXT_ID] );
    }

    return null;
  }


  
  loadElement<P extends Gltf2.Property>(data: P): Promise<ElementOfType<PropertyType<P>>>{
    return null;
  }

}


export default class KHR_texture_transform implements IExtensionFactory {
  readonly name: string = EXT_ID;
  createInstance(gltfLoader: GltfLoader): IExtensionInstance {
    return new Instance(gltfLoader);
  }
}