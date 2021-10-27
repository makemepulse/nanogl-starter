
/// <


import ExtensionsRegistry from './extensions/Registry';

import type Accessor from './elements/Accessor';
import type BufferView from './elements/BufferView';
import type Buffer from './elements/Buffer';
import type Animation from './elements/Animation';
import type Node from './elements/Node';
import type { IMaterial } from './elements/Material';
import type Mesh from './elements/Mesh';
import type Skin from './elements/Skin';
import type Camera from './elements/Camera';


import NanoCamera from 'nanogl-camera';
import { GLContext } from 'nanogl/types';
import NanoglNode from 'nanogl-node';
import { ISemantics, DefaultSemantics } from './Semantics';
import { IExtensionFactory } from './extensions/IExtension';
import GltfTypes from './types/GltfTypes';
import { AnyElement, ElementOfType, IElement } from './types/Elements';
import IRenderable from './renderer/IRenderable';
import Assert from './lib/assert';
import IRenderConfig, { DefaultRenderConfig } from './IRenderConfig';
import Material from './elements/Material';


class ElementCollection<T extends AnyElement = AnyElement>{
  
  // private _byNames : Map<string, T> = new Map()
  indexed : T[] = []
  list :  T[] = []
  
  addElement(element: T, index  = -1 ){
    if(index>-1) this.indexed[index] = element  ;
    this.list.push( element);
  }
}

/** Gltf file representation */
export default class Gltf {


  private static _extensionsRegistry: ExtensionsRegistry = new ExtensionsRegistry();
  private static _semantics    : ISemantics = new DefaultSemantics();
  private static _renderConfig : IRenderConfig = DefaultRenderConfig();
  
  static addExtension(ext: IExtensionFactory) {
    Gltf._extensionsRegistry.addExtension(ext);
  }

  static getSemantics():ISemantics {
    return this._semantics;
  }

  static setSemantics(semantics:ISemantics) {
    semantics ?? (this._semantics = semantics);
  }

  static getRenderConfig() : IRenderConfig {
    return this._renderConfig;
  }

  static getExtensionsRegistry(): ExtensionsRegistry {
    return this._extensionsRegistry;
  }
  

  
  
  private _elements: AnyElement[];
  private _collections: Map<GltfTypes, ElementCollection>;
  
  
  readonly root : NanoglNode = new NanoglNode();
  renderables: IRenderable[];
  cameraInstances: NanoCamera[]
  extras : any = {}

  constructor( ) {

    this._collections = new Map<GltfTypes, ElementCollection>([

      [GltfTypes.ACCESSOR               , new ElementCollection()],
      [GltfTypes.ACCESSOR_SPARSE        , new ElementCollection()],
      [GltfTypes.ACCESSOR_SPARSE_INDICES, new ElementCollection()],
      [GltfTypes.ACCESSOR_SPARSE_VALUES , new ElementCollection()],
      [GltfTypes.ANIMATION              , new ElementCollection()],
      [GltfTypes.ANIMATION_SAMPLER      , new ElementCollection()],
      [GltfTypes.ANIMATION_CHANNEL      , new ElementCollection()],
      [GltfTypes.ASSET                  , new ElementCollection()],
      [GltfTypes.BUFFER                 , new ElementCollection()],
      [GltfTypes.BUFFERVIEW             , new ElementCollection()],
      [GltfTypes.CAMERA                 , new ElementCollection()],
      [GltfTypes.IMAGE                  , new ElementCollection()],
      [GltfTypes.MATERIAL               , new ElementCollection()],
      [GltfTypes.MESH                   , new ElementCollection()],
      [GltfTypes.NODE                   , new ElementCollection()],
      [GltfTypes.NORMAL_TEXTURE_INFO    , new ElementCollection()],
      [GltfTypes.OCCLUSION_TEXTURE_INFO , new ElementCollection()],
      [GltfTypes.PRIMITIVE              , new ElementCollection()],
      [GltfTypes.SAMPLER                , new ElementCollection()],
      [GltfTypes.SCENE                  , new ElementCollection()],
      [GltfTypes.SKIN                   , new ElementCollection()],
      [GltfTypes.TEXTURE                , new ElementCollection()],
      [GltfTypes.TEXTURE_INFO           , new ElementCollection()],

    ])

    this._elements = []

  }


  async allocateGl(gl: GLContext): Promise<any> {

    const allocPromises: Promise<any>[] = []
    for (const element of <IElement[]>this._elements) {
      const p = element.allocateGl?.(gl);
      p ?? allocPromises.push(p as Promise<any>);
    }

    await Promise.all(allocPromises);

    this.renderables = this.nodes
      .map( n=>n.renderable )
      .filter( n=>n!==undefined )

      
    for (const node of this.nodes) {
      if( !node._parent ){
        this.root.add( node );
      }
    }

    this.createCameras();

  }

  createCameras(){
    
    this.cameraInstances = this.nodes
      .filter( n=>n.camera!==undefined )
      .map( n=> {
        const cam = new NanoCamera( n.camera.lens )
        n.add( cam );
        return cam
       } )
      
  }


  get buffers(): Buffer[] {
    return this._getCollection(GltfTypes.BUFFER).list;
  }

  get bufferViews(): BufferView[] {
    return this._getCollection(GltfTypes.BUFFERVIEW).list;
  }

  get accessors(): Accessor[] {
    return this._getCollection(GltfTypes.ACCESSOR).list;
  }

  get animations(): Animation[] {
    return this._getCollection(GltfTypes.ANIMATION).list;
  }

  get meshes(): Mesh[] {
    return this._getCollection(GltfTypes.MESH).list;
  }

  get nodes(): Node[] {
    return this._getCollection(GltfTypes.NODE).list;
  }

  get materials(): IMaterial[] {
    return this._getCollection(GltfTypes.MATERIAL).list;
  }

  get cameras(): Camera[] {
    return this._getCollection(GltfTypes.CAMERA).list;
  }

  get skins(): Skin[] {
    return this._getCollection(GltfTypes.SKIN).list;
  }

  
  
  
  getAllElements(): AnyElement[] {
    return this._elements;
  }
  
  
  getElement<T extends GltfTypes>(type: T, index: number): ElementOfType<T> {
    return this._getCollection(type).indexed[index];
  }
  
  
  getElementByName<T extends GltfTypes>(type: T, name: string): ElementOfType<T> {
    const list = this._getCollection(type).list;
    for (const el of list) {
      if (el.name === name) return el;
    }
    return null;
  }

  getElementsByName<T extends GltfTypes>(type: T, name: string): ElementOfType<T>[] {
    const list = this._getCollection(type).list;
    const ouput : ElementOfType<T>[] = [];
    for (const el of list) {
      if (el.name === name) ouput.push(el);
    }
    return ouput;
  }


  getMesh     ( name:string ): Mesh      { return this.getElementByName( GltfTypes.MESH     , name ) }
  getMaterial ( name:string ): IMaterial { return this.getElementByName( GltfTypes.MATERIAL , name ) }
  getNode     ( name:string ): Node      { return this.getElementByName( GltfTypes.NODE     , name ) }
  getAnimation( name:string ): Animation { return this.getElementByName( GltfTypes.ANIMATION, name ) }
  
  
  private _getCollection<T extends GltfTypes>(type: T): ElementCollection<ElementOfType<T>> {
    return this._collections.get(type) as ElementCollection<ElementOfType<T>>;
  }
  
  addElement(element: AnyElement, index  = -1 ) {
    const collection = this._getCollection( element.gltftype );
    collection.addElement( element, index );
    this._elements.push(element);
  }


}

