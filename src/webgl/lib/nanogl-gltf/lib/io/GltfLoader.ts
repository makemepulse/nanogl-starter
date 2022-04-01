
import Gltf from "../Gltf";

import IOInterface from "./IOInterface";
import { ExtensionList } from "../extensions/Registry";
import Gltf2 from "../types/Gltf2";
import { ElementOfType, PropertyType, AnyElement, PromiseElementForProperty } from "../types/Elements";
import GltfTypes from "../types/GltfTypes";

import "../extensions/DefaultExtension"
import { GltfLoaderOptions } from "./GltfLoaderOptions";
import { IMaterial } from "../elements/Material";
import Assert from "../lib/assert";
import { AbortSignal } from "@azure/abort-controller";


let UID = 0;

function getUUID(): string {
  return (UID++) + "";
}


const defaultMaterialData : Gltf2.IMaterial = {
  gltftype : GltfTypes.MATERIAL,
  elementIndex : -1,
  elementParent : null,
  uuid : '_default_mat_',
  name : 'default',
}


class PendingElement {

  readonly data : Gltf2.IProperty;
  readonly promise : Promise<AnyElement>

  constructor( data: Gltf2.IProperty, element: Promise<AnyElement> ){
    this.data = data;
    this.promise = element;
  }

  

}



const MAGIC      = 0x46546C67; // "glTF"
const JSON_MAGIC = 0x4E4F534A; // "JSON"
const GLB_HEADER_SIZE = 20;



export default class GltfLoader {



  gltf: Gltf;

  _url: string;
  _baseUrl: string;
  gltfIO: IOInterface;

  _data: Gltf2.IGLTF;

  _glbData? : ArrayBuffer;

  _extensions: ExtensionList;

  _elements: Map<string, Promise<AnyElement>> = new Map();
  _pendingElements : PendingElement[] = []
  _byType  : Map<GltfTypes, Promise<AnyElement>[]> = new Map();
  _propertyMaps  : Map<GltfTypes, Gltf2.Property[]> = new Map();

  readonly abortSignal: AbortSignal;


  constructor(gltfIO: IOInterface, url: string, options : GltfLoaderOptions = {} ) {
    this.gltfIO = gltfIO;

    this._url = url;
    this._baseUrl = options.baseurl;

    this.abortSignal = options.abortSignal ?? AbortSignal.none;

    if( this._baseUrl === undefined )
      [this._baseUrl, this._url] = gltfIO.resolveBaseDir( this._url );

    this.gltf = new Gltf();
    this._data = null;

    this._extensions = new ExtensionList();
    Gltf.getExtensionsRegistry().setupExtensions( this, options.extensions );

  }


  async load(): Promise<Gltf> {
    const buffer = await this.gltfIO.loadBinaryResource( this.gltfIO.resolvePath( this._url, this._baseUrl ), this.abortSignal )
    this.unpack(buffer)
    await this.parseAll()
    return this.gltf
  }



  unpack( buffer: ArrayBuffer ): void {
    const magic = new Uint32Array(buffer, 0, 1)[0];

    if (magic === MAGIC) {
      this.unpackGlb(buffer);
    } else {
      const jsonStr = this.gltfIO.decodeUTF8(buffer);
      this._data = JSON.parse(jsonStr);
      this.prepareGltfDatas(this._data);
    }


  }


  unpackGlb(buffer: ArrayBuffer) {

    const [, version, , jsonSize, magic] = new Uint32Array(buffer, 0, 5);
    // Check that the version is 2
    if (version !== 2)
      throw new Error('Binary glTF version is not 2');

    // Check that the scene format is 0, indicating that it is JSON
    if (magic !== JSON_MAGIC)
      throw new Error('Binary glTF scene format is not JSON');

    const scene = this.gltfIO.decodeUTF8(buffer, GLB_HEADER_SIZE, jsonSize);
    this._glbData = buffer.slice(GLB_HEADER_SIZE + jsonSize + 8);
    this._data = JSON.parse(scene);
    this.prepareGltfDatas(this._data);


  }



  resolveUri( uri : string ) : string {
    return this.gltfIO.resolvePath(uri, this._baseUrl);
  }

  // loadBuffer = (b: Buffer) => {
  loadBufferUri = (uri? : string):Promise<ArrayBuffer> =>  {
    if (uri === undefined)
      return Promise.resolve(this._glbData);

      const resolvedUri = this.gltfIO.resolvePath(uri, this._baseUrl);
    return this.gltfIO.loadBinaryResource(resolvedUri, this.abortSignal)
  }


  parseCommonGltfProperty<P extends Gltf2.Property>(data: P, element:ElementOfType<PropertyType<P>>){
    if( element.name === undefined ) {
      element.name = (data as Gltf2.IChildRootProperty).name;
    }
    if( element.extras === undefined ) {
      element.extras = data.extras;
    }
  }
  
  async _createElement<P extends Gltf2.Property>(data: P): PromiseElementForProperty<P> {
    const element = await this._createElementInstance( data );
    this.parseCommonGltfProperty( data, element );
    return this._extensionsAccept( data, element );
  }


  // create element
  _createElementInstance<P extends Gltf2.Property>(data: P): PromiseElementForProperty<P> {
    const extensions = this._extensions._list;
    for (const ext of extensions) {
      const res = ext.loadElement(data)
      if( res === undefined )
        throw new Error( "extension should not return undefined")
      if (res !== null) return res;
    }
    throw new Error( "Unhandled type")
  }

  // create element
  async _extensionsAccept<P extends Gltf2.Property>(data: P, element : ElementOfType<PropertyType<P>> ): PromiseElementForProperty<P> {
    const extensions = this._extensions._list;
    let res : PromiseElementForProperty<P>;

    for (const ext of extensions) {
      res = ext.acceptElement( data, element )  
      if( res !== null ){
        element = await res;
      }
    }
    return element;
  }


  // create elementif not already created
  _loadElement<P extends Gltf2.Property,>(data: P): PromiseElementForProperty<P> {
    let res = this._elements.get(data.uuid) as PromiseElementForProperty<P>;
    if (res === undefined) {
      res = this._createElement(data);
      const pe = new PendingElement( data, res );
      this._pendingElements.push( pe );
      this._elements.set(data.uuid, res);
    }
    return res;
  }


  loadDefaultMaterial() : Promise<IMaterial>{
    return this._loadElement(defaultMaterialData);
  }


  private _getElementHolder<T extends GltfTypes>( type:T ) : Promise<ElementOfType<T>>[] {
    let array : Promise<AnyElement>[] = this._byType.get( type );
    if( array === undefined ){
      array = [];
      this._byType.set( type, array );
    }
    return array as Promise<ElementOfType<T>>[];
  }

  getElement<T extends GltfTypes>( type : T, index : number ): Promise<ElementOfType<T>> {
    const holder = this._getElementHolder( type );
    if( holder[index] !== undefined ) return holder[index];
    // get existing or create if not exist!
    const properties = this._propertyMaps.get(type);
    const property = properties[index];
    return this._loadElement( property ) as Promise<ElementOfType<T>>;
  }





  async parseAll(): Promise<void>{

    this._extensions.validate(this._data.extensionsUsed, this._data.extensionsRequired);

    const asset = await this._loadElement(this._data.asset);
    if( asset.version != '2.0' ){
      console.warn(`Gltf version should be "2.0" found "${asset.version}"` );
    } 

    await this._loadElements( this._data.nodes );
    await this._loadElements( this._data.animations );
    await this.resolveElements();

  }
  

  private _loadElements<T extends Gltf2.Property>( dataList? : T[] ) : Promise<void> {
    if (dataList !== undefined) {
      const promises = dataList.map( (data)=>this._loadElement(data))
      return Promise.all( promises ).then();
    }
  }

  /**
   * wait for all pending elements creation to complete
   * and register them in Gltf object
   */
  async resolveElements() {

    while( this._pendingElements.length > 0 ){

      const pelements = this._pendingElements.splice( 0, this._pendingElements.length )
      const elements = await Promise.all( pelements.map( (pe)=>pe.promise ) );
      for (let i = 0; i < pelements.length; i++) {
        const element = elements[i];
        Assert.isDefined( element.gltftype );
        this.gltf.addElement( elements[i], pelements[i].data.elementIndex );
      }
    }

  }


  prepareGltfDatas(gltfData: Gltf2.IGLTF) {

    this.prepareGltfRootProperties( gltfData.accessors  , GltfTypes.ACCESSOR  , null );
    this.prepareGltfRootProperties( gltfData.animations , GltfTypes.ANIMATION , null );
    this.prepareGltfRootProperties( [gltfData.asset]    , GltfTypes.ASSET     , null );
    this.prepareGltfRootProperties( gltfData.buffers    , GltfTypes.BUFFER    , null );
    this.prepareGltfRootProperties( gltfData.bufferViews, GltfTypes.BUFFERVIEW, null );
    this.prepareGltfRootProperties( gltfData.cameras    , GltfTypes.CAMERA    , null );
    this.prepareGltfRootProperties( gltfData.images     , GltfTypes.IMAGE     , null );
    this.prepareGltfRootProperties( gltfData.materials  , GltfTypes.MATERIAL  , null );
    this.prepareGltfRootProperties( gltfData.meshes     , GltfTypes.MESH      , null );
    this.prepareGltfRootProperties( gltfData.nodes      , GltfTypes.NODE      , null );
    this.prepareGltfRootProperties( gltfData.samplers   , GltfTypes.SAMPLER   , null );
    this.prepareGltfRootProperties( gltfData.scenes     , GltfTypes.SCENE     , null );
    this.prepareGltfRootProperties( gltfData.skins      , GltfTypes.SKIN      , null );
    this.prepareGltfRootProperties( gltfData.textures   , GltfTypes.TEXTURE   , null );



    if( gltfData.animations !== undefined ){
      for (const animation of gltfData.animations) {
        this.prepareGltfProperties( animation.samplers, GltfTypes.ANIMATION_SAMPLER, animation );
        this.prepareGltfProperties( animation.channels, GltfTypes.ANIMATION_CHANNEL, animation );
      }
    }

    if( gltfData.materials !== undefined ){
      for (const material of gltfData.materials) {
        this.prepareGltfProperty( material.normalTexture, GltfTypes.NORMAL_TEXTURE_INFO, -1, material );
        this.prepareGltfProperty( material.occlusionTexture, GltfTypes.OCCLUSION_TEXTURE_INFO, -1, material );
        this.prepareGltfProperty( material.emissiveTexture, GltfTypes.TEXTURE_INFO, -1, material );

        if( material.pbrMetallicRoughness !== undefined ){
          this.prepareGltfProperty( material.pbrMetallicRoughness.baseColorTexture, GltfTypes.TEXTURE_INFO, -1, material );
          this.prepareGltfProperty( material.pbrMetallicRoughness.metallicRoughnessTexture, GltfTypes.TEXTURE_INFO, -1, material );
        }
      }
    }

    if( gltfData.meshes !== undefined ){
      for (const mesh of gltfData.meshes) {
        this.prepareGltfProperties( mesh.primitives, GltfTypes.PRIMITIVE, mesh );
      }
    }

    if( gltfData.accessors !== undefined ){
      for (const accessor of gltfData.accessors) {
        this.prepareGltfProperty( accessor.sparse, GltfTypes.ACCESSOR_SPARSE, -1, accessor );
        if( accessor.sparse !== undefined ){
          this.prepareGltfProperty( accessor.sparse.indices, GltfTypes.ACCESSOR_SPARSE_INDICES, -1, accessor.sparse );
          this.prepareGltfProperty( accessor.sparse.values, GltfTypes.ACCESSOR_SPARSE_VALUES, -1, accessor.sparse );
        }
      }
    }

  }


  prepareGltfProperties(elementsData: Gltf2.Property[], type: GltfTypes, parent : Gltf2.Property ) {
    if( elementsData === undefined ) return;
    for (let i = 0; i < elementsData.length; i++) {
      const element = elementsData[i];
      this.prepareGltfProperty( element, type, i, parent );
    }
  }


  prepareGltfRootProperties(elementsData: Gltf2.Property[], type: GltfTypes, parent : Gltf2.Property ) {
    if( elementsData === undefined ) return;
    this._propertyMaps.set( type, elementsData )
    for (let i = 0; i < elementsData.length; i++) {
      const element = elementsData[i];
      this.prepareGltfProperty( element, type, i, parent );
    }

  }


  prepareGltfProperty( element: Gltf2.Property, type: GltfTypes, index : number, parent : Gltf2.Property ) {
    if( element === undefined ) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (element as any).gltftype = type;

    element.uuid = getUUID();
    element.elementIndex  = index;
    element.elementParent = parent;
  }

}

