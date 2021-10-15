import { IExtensionFactory, IExtensionInstance } from "../IExtension";
import GltfLoader from "../../io/GltfLoader";
import { ElementOfType, PropertyType, AnyElement } from "../../types/Elements";
import Gltf2 from "../../types/Gltf2";
import DracoDecoder from './draco-decoder'
import GltfTypes from "../../types/GltfTypes";
import DracoPrimitive from "./DracoPrimitive";
import { IDracoResponse } from "./DecoderAPI";

const EXT_ID  = 'KHR_draco_mesh_compression';

type DracoExtensionData = {
  bufferView : number
  attributes : Record<string, number>
}


class Instance implements IExtensionInstance {


  readonly name: string = EXT_ID;
  readonly priority: number = 1;
  
  loader: GltfLoader;


  constructor( gltfLoader : GltfLoader) {
    this.loader = gltfLoader;    
  }
  


  acceptElement<P extends Gltf2.Property>(data: P, element: ElementOfType<PropertyType<P>> ) : null | Promise<ElementOfType<PropertyType<P>>> {
    return null;
  }

  loadElement<P extends Gltf2.Property>(data: P): Promise<ElementOfType<PropertyType<P>>>;

  loadElement(data: Gltf2.Property): Promise<AnyElement> {
    if( data.gltftype === GltfTypes.PRIMITIVE &&  data.extensions && data.extensions[EXT_ID] ){
      return this.loadPrimitive( data );
    }
    return null;
  }

  async loadPrimitive(data: Gltf2.IMeshPrimitive): Promise<AnyElement> {
    const dracoExtData : DracoExtensionData = data.extensions[EXT_ID];
    const bufferView = await this.loader.getElement( GltfTypes.BUFFERVIEW, dracoExtData.bufferView );

    const dracoBuffer = bufferView.buffer._bytes.slice( bufferView.getByteOffset(), bufferView.getByteOffset()+bufferView.byteLength );

    const request = {
      buffer     : dracoBuffer,
      attributes : dracoExtData.attributes
    }
    
    const res : IDracoResponse = await KHR_draco_mesh_compression.dracoDecoder.transcode( request )

    if( res.error ){
      throw new Error( res.error )
    }

    const primitive = new DracoPrimitive();
    primitive.setDatas( res.geometry );
    await primitive.parse( this.loader, data );

    return primitive;
  }



}

export default class KHR_draco_mesh_compression implements IExtensionFactory {
  readonly name: string = EXT_ID;

  static dracoDecoder : any = new DracoDecoder( {
    wasmUrl   : 'https://www.gstatic.com/draco/v1/decoders/draco_decoder_gltf.wasm',
    moduleUrl : 'https://www.gstatic.com/draco/v1/decoders/draco_decoder_gltf.js',
   } );

  createInstance(gltfLoader: GltfLoader): IExtensionInstance {
    return new Instance(gltfLoader);
  }
}