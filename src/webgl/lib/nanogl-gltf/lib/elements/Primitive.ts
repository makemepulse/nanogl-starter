import Accessor from './Accessor'
import { IMaterial } from './Material'
import { GLContext } from 'nanogl/types';
import GLArrayBuffer from 'nanogl/arraybuffer';
import Program from 'nanogl/program';
import Vao from 'nanogl-vao';
import GLIndexBuffer from 'nanogl/indexbuffer';
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import BufferView from './BufferView';
import Gltf from '../Gltf';
import { IElement } from '../types/Elements';
import Bounds from 'nanogl-pbr/Bounds';



export class Attribute {

  /**
   * the standard Semantic for this attribute (POSITION, NORMAL, WEIGHTS_0 etc)
   */
  semantic : string;

  /**
   * the accessor providing data for this attribute
   */
  accessor : Accessor;

  /**
   * the glsl attribute name
   */
  glslname : string
  
  constructor( semantic:string , accessor:Accessor ){
    this.semantic = semantic;
    this.accessor = accessor;
    this.glslname = Gltf.getSemantics().getAttributeName( semantic );
  }
  
}


class BufferInfos {
  
  attributes: Attribute[];
  accessor : Accessor;

  constructor(accessor:Accessor){
    this.accessor = accessor;
    this.attributes = [];
  }

  addAttribute( attribute : Attribute ){
    this.attributes.push( attribute );
  }
  
}


export class AttributesSet {

  
  _attributes: Attribute[];

  constructor(){
    this._attributes = [];
  }

  get length() :number {
    return this._attributes.length;
  }

  get attributes(): Attribute[]{
    return this._attributes;
  }

  add( attribute : Attribute ){
    this._attributes.push( attribute );
  }



  getSemantic( semantic : string ) : Attribute {
    for (const a of this._attributes ) {
      if( a.semantic === semantic ) return a;
    }
    return null;
  }



  /*
   * return set of attributes group by bufferView
   */
  getBuffersViewSets() : BufferInfos[] {

    const map : Map<BufferView, BufferInfos> = new Map();
    
    for (const a of this._attributes ) {
      const bId = a.accessor.bufferView;
      if( !map.has( bId ) ){
        map.set( bId, new BufferInfos( a.accessor) );
      }
      map.get( bId ).addAttribute( a );
    }

    return Array.from( map.values() );
  }


}



const ELEMENT_ARRAY_BUFFER = 0x8893 
const ARRAY_BUFFER = 0x8892


export default class Primitive implements IElement {

  readonly gltftype : GltfTypes.PRIMITIVE = GltfTypes.PRIMITIVE;
  
  name        : undefined | string;
  extras      : any   ;
  
  // gltf
  attributes : AttributesSet;
  mode       : Gltf2.MeshPrimitiveMode;
  material   : IMaterial = null;
  indices    : Accessor = null;
  targets    : AttributesSet[] = null;
  
  
  // rendering
  _vaoMap     : Map<string, Vao>
  _currentVao : Vao;
  buffers     : GLArrayBuffer[];
  indexBuffer : GLIndexBuffer;


  readonly bounds : Bounds = new Bounds();


  _calculaterBounds() : void {
    const pos = this.attributes.getSemantic( 'POSITION' );
    if( pos != null && pos.accessor.min && pos.accessor.max ){
      this.bounds.fromMinMax( pos.accessor.min, pos.accessor.max );
    }
  }


  async parse( gltfLoader:GltfLoader, data:Gltf2.IMeshPrimitive ) : Promise<any> {

    this.attributes = new AttributesSet();
    await this.parseAttributeSet( gltfLoader, this.attributes, data.attributes );

    
    if( data.indices !== undefined )
      this.indices = await gltfLoader.getElement( GltfTypes.ACCESSOR, data.indices );

    if( data.material !== undefined ){
      this.material = await gltfLoader.getElement( GltfTypes.MATERIAL, data.material );
    } else {
      this.material = await gltfLoader.loadDefaultMaterial();
    }

    if( data.mode !== undefined)
      this.mode = data.mode;
    else
      this.mode = Gltf2.MeshPrimitiveMode.DEFAULT;

    if( data.targets !== undefined ){
      this.targets = [];

      for (let i = 0; i < data.targets.length; i++) {
        const tgt = data.targets[i];
        const aset = new AttributesSet();
        await this.parseMorphAttributeSet( gltfLoader, aset, tgt, i );
        this.targets.push( aset );
      }
    }

    this._calculaterBounds();
  }


  async parseAttributeSet( gltfLoader:GltfLoader, aset : AttributesSet, data : any ) {
    
    for (const attrib in data ) { 
      const accessor:Accessor = await gltfLoader.getElement( GltfTypes.ACCESSOR, data[attrib] );
      aset.add( new Attribute( attrib, accessor ) );
    }

  }
  

  async parseMorphAttributeSet( gltfLoader:GltfLoader, aset : AttributesSet, data : any, morphIndex : number ) {
    
    for (const attrib in data ) { 
      const accessor:Accessor = await gltfLoader.getElement( GltfTypes.ACCESSOR, data[attrib] );
      const attribute = new Attribute( attrib, accessor )
      attribute.glslname = Gltf.getSemantics().getMorphedAttributeName( attribute.semantic, morphIndex );
      aset.add( attribute );
    }

  }



  allocateGl( gl : GLContext ) : void {

    this._vaoMap = new Map();
    this.buffers = [];

    const buffersSet = this.attributes.getBuffersViewSets();
    
    for( const set of buffersSet ){
      this.buffers.push( this.createArrayBuffer( gl, set ) );
    }

    if( this.indices !== null ){
      const glBuffer = this.indices.bufferView.getWebGLBuffer( gl, ELEMENT_ARRAY_BUFFER )
      this.indexBuffer = new GLIndexBuffer( gl, this.indices.componentType, undefined, gl.STATIC_DRAW, glBuffer )
      this.indexBuffer.byteLength = this.indices.bufferView.byteLength;
    }

    if( this.targets !== null ){
      for (let i = 0; i < this.targets.length; i++) {
        const target = this.targets[i];
        const buffersSet = target.getBuffersViewSets();
        for( const set of buffersSet ){
          this.buffers.push( this.createArrayBuffer( gl, set ) );
        }
      }
    }

  }


  createArrayBuffer( gl: GLContext, set : BufferInfos ){

    const bufferView = set.accessor.bufferView
    const glBuffer = bufferView.getWebGLBuffer( gl, ARRAY_BUFFER )

    const glArraybuffer = new GLArrayBuffer(gl, undefined, gl.STATIC_DRAW, glBuffer );
    glArraybuffer.byteLength = bufferView.byteLength;
    glArraybuffer.stride = set.accessor._stride;
    glArraybuffer._computeLength();


    for (const attribute of set.attributes ) {
      const def = this.createAttributeDefinition( attribute );
      glArraybuffer.attribs.push(def);
    }
    
    return glArraybuffer;
    
  }
  

  createAttributeDefinition( attribute : Attribute ){
    const accessor = attribute.accessor;
    return {
      name      : attribute.glslname     ,
      type      : accessor .componentType,
      size      : accessor .numComps     ,
      normalize : accessor .normalized   ,
      offset    : accessor .byteOffset   ,
      stride    : accessor ._stride
    }
  }


  getVao( prg: Program ){
    const id = prg._cuid.toString();

    if( !this._vaoMap.has( id ) ){
      const vao = new Vao( prg.gl );
      vao.setup( prg, this.buffers, this.indexBuffer );
      this._vaoMap.set( id, vao );
    }

    return this._vaoMap.get( id );
  }


  bindVao( prg: Program ){
    this._currentVao = this.getVao( prg )
    this._currentVao.bind();
  }


  render(){
    if( this.indexBuffer ){
      this.indexBuffer.draw( this.mode, this.indices.count, this.indices.byteOffset );
    }
    else 
      this.buffers[0].draw( this.mode );    
  }


  unbindVao(){
    this._currentVao.unbind()
  }

}

