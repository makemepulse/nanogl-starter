
import Assert from '../lib/assert';
import BufferView from './BufferView'
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import AccessorSparse from './AccessorSparse';
import { IElement } from '../types/Elements';
import { TypedArrayConstructor, TypedArray } from '../types/TypedArray';




type normalizeFunc = (n:number)=>number;


export enum AccessorGlslType {
  float = "float",
  vec2  = "vec2",
  vec3  = "vec3",
  vec4  = "vec4",
  mat2  = "mat2",
  mat3  = "mat3",
  mat4  = "mat4",
}




//https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md_animations
const NORMALIZE_BYTE           = (c:number) => Math.max(c / 127.0, -1.0);
const NORMALIZE_UNSIGNED_BYTE  = (c:number) => c / 255.0;
const NORMALIZE_SHORT          = (c:number) => Math.max(c / 32767.0, -1.0);
const NORMALIZE_UNSIGNED_SHORT = (c:number) => c / 65535.0	;
const NORMALIZE_UNSIGNED_INT   = (c:number) => c;
const NORMALIZE_FLOAT          = (c:number) => c;


function getNormalizeFunction( t:Gltf2.AccessorComponentType ) : normalizeFunc 
{
  switch (t) {
    case Gltf2.AccessorComponentType.BYTE          : return NORMALIZE_BYTE          ;
    case Gltf2.AccessorComponentType.UNSIGNED_BYTE : return NORMALIZE_UNSIGNED_BYTE ;
    case Gltf2.AccessorComponentType.SHORT         : return NORMALIZE_SHORT         ;
    case Gltf2.AccessorComponentType.UNSIGNED_SHORT: return NORMALIZE_UNSIGNED_SHORT;
    case Gltf2.AccessorComponentType.UNSIGNED_INT  : return NORMALIZE_UNSIGNED_INT  ;
    case Gltf2.AccessorComponentType.FLOAT         : return NORMALIZE_FLOAT         ;
  }
}


export function getArrayForDataType( t:Gltf2.AccessorComponentType ) : TypedArrayConstructor
{
  switch (t) {
    case Gltf2.AccessorComponentType.BYTE          : return Int8Array   ;
    case Gltf2.AccessorComponentType.UNSIGNED_BYTE : return Uint8Array  ;
    case Gltf2.AccessorComponentType.SHORT         : return Int16Array  ;
    case Gltf2.AccessorComponentType.UNSIGNED_SHORT: return Uint16Array ;
    case Gltf2.AccessorComponentType.UNSIGNED_INT  : return Uint32Array ;
    case Gltf2.AccessorComponentType.FLOAT         : return Float32Array;
  }
}  


function getBytesLengthForDataType( t:Gltf2.AccessorComponentType ):number
{
  return getArrayForDataType(t).BYTES_PER_ELEMENT;
}  


function getSizeForComponentType( t:Gltf2.AccessorType )
{
  switch (t) {
    case Gltf2.AccessorType.SCALAR: return 1;
    case Gltf2.AccessorType.VEC2  : return 2;
    case Gltf2.AccessorType.VEC3  : return 3;
    case Gltf2.AccessorType.VEC4  : return 4;
    case Gltf2.AccessorType.MAT2  : return 4;
    case Gltf2.AccessorType.MAT3  : return 9;
    case Gltf2.AccessorType.MAT4  : return 16;
  }
}  


function getGlslTypeForComponentType( t:Gltf2.AccessorType )
{
  switch (t) {
    case Gltf2.AccessorType.SCALAR: return AccessorGlslType.float;
    case Gltf2.AccessorType.VEC2  : return AccessorGlslType.vec2 ;
    case Gltf2.AccessorType.VEC3  : return AccessorGlslType.vec3 ;
    case Gltf2.AccessorType.VEC4  : return AccessorGlslType.vec4 ;
    case Gltf2.AccessorType.MAT2  : return AccessorGlslType.mat2 ;
    case Gltf2.AccessorType.MAT3  : return AccessorGlslType.mat3 ;
    case Gltf2.AccessorType.MAT4  : return AccessorGlslType.mat4 ;
  }
}  



export type BaseAccessorData = Gltf2.IAccessor | Gltf2.IAccessorSparseIndices | Gltf2.IAccessorSparseValues;

export class BaseAccessor {

  normalized           = false;
  /**
   * bytes offset in the BufferView
   */
  byteOffset            = 0;
  /**
   * number of elements 
   */
  count                 = 0;

  _stride               = 0;
  _strideElem           = 0;
  componentType  : Gltf2.AccessorComponentType        ;
  type           : Gltf2.AccessorType        ;
  max          ? : number[]    ;
  min          ? : number[]    ;
  bufferView     : BufferView   ;
  _valueHolder   : TypedArray   ;
  _array         : TypedArray   ;
  _normalizeFunc : normalizeFunc;
  sparse         : AccessorSparse|null  ;




  get numComps(){
    return getSizeForComponentType(this.type);
  }

  get bytesPerElem(){
    return getBytesLengthForDataType(this.componentType);
  }

  get glslType() : AccessorGlslType {
    return getGlslTypeForComponentType( this.type );
  }
 


  *[Symbol.iterator](){
    const holder = this.createElementHolder();
    for (let i=0; i < this.count; i++) {
      this.getValue( holder, i )
      yield holder;
    }
  }


  
  /**
   * 
   */
  createElementHolder(normalized : boolean = this.normalized) : TypedArray{
    if( normalized ) 
      return new Float32Array( this.numComps );
    else
      return new (getArrayForDataType(this.componentType))(this.numComps);
  }

  
  /**
   * @return {TypedArray} 
   */
  createElementHolderArray( size : number, normalized : boolean = this.normalized) : TypedArray{
    if( normalized ) 
      return new Float32Array( this.numComps*size );
    else
      return new (getArrayForDataType(this.componentType))(this.numComps*size);
  }




  /**
   * Copy accessor value at the given index to output array
   * @param {number} index 
   * @param {boolean} normalized 
   */
  getScalar( index :number, normalized : boolean = this.normalized ):number{
    
    let s;
    
    if( this.sparse !== null ){
      s = this.sparse.getRawScalar( index );
    }else{
      s = this.getRawScalar( index );
    }

    if( normalized ){
      s = this._normalizeFunc( s );
    } 
    
    return s;

  }

  /**
   * Copy accessor value at the given index to output array. Skip sparse resolve
   * @param {number} index 
   */
  getRawScalar( index:number ):number{
    const offset = this._strideElem * index;
    return this._array[offset];
  }



  /**
   * Copy accessor value at the given index to output array
   * @param {TypedArray} out output value
   * @param {number} index 
   * @param {boolean} normalized 
   */
  getValue( out:TypedArray, index:number, normalized:boolean = this.normalized ){

    const _out = normalized ? this._valueHolder : out;

    if( this.sparse !== null ){
      this.sparse.getRawValue( _out, index );
    } else {
      this.getRawValue( _out, index );
    }

    if( normalized ){
      this._normalize( out, _out );
    }

  }

  getValues( out:TypedArray, index:number, size : number ){

    if( this.sparse !== null ){
      // TODO: try this one
      throw new Error('Cant call getValues in sparsed accessor' )
      // this.sparse.getRawValues( out, index, size );
    } else {
      this.getRawValues( out, index, size );
    }

    if( this.normalized ){
      this._normalize( out, out );
    }

  }

  getRawValue( out:TypedArray, index:number ){
    const offset = this._strideElem * index;
    const ncomps = this.numComps;
    for (let i = 0; i < ncomps; i++) {
      out[i] = this._array[i+offset];
    }
  }

  getRawValues( out:TypedArray, index:number, size : number ){
    const ncomps = this.numComps;
    for (let k = 0; k < size; k++) {
      const j = k*ncomps;
      const offset = this._strideElem * (index+k);
      for (let i = 0; i < ncomps; i++) {
        out[j+i] = this._array[i+offset];
      }
    }
  }


  _normalize( out:TypedArray, raw:TypedArray ){
    const fn = this._normalizeFunc;
    const ncomps = this.numComps;
    for (let i = 0; i < ncomps; i++) {
      out[i] = fn( raw[i] );
    }
  }

}



export default class Accessor extends BaseAccessor implements IElement {

  readonly gltftype : GltfTypes.ACCESSOR = GltfTypes.ACCESSOR;
  name        : undefined | string;
  extras      : any   ;

  async parse( gltfLoader:GltfLoader, data:Gltf2.IAccessor ) : Promise<any>{

      
    const { 
      byteOffset  = 0,
      normalized  = false,
    } = data;

    this.normalized     = normalized;
    this.byteOffset     = byteOffset;
    
    this.componentType  = data.componentType;
    this.count          = data.count;
    this.type           = data.type;
    this.max            = data.max;
    this.min            = data.min;
    
    
    
    
    if( data.bufferView !== undefined ){
      this.bufferView     = await gltfLoader.getElement( GltfTypes.BUFFERVIEW, data.bufferView );
      const Arr = getArrayForDataType(this.componentType);

      if( this.bufferView.byteStride === 0 ){
        this._stride      = this.numComps * this.bytesPerElem;
        this._strideElem  = this.numComps;
      } else {
        this._stride      = this.bufferView.byteStride;
        this._strideElem  = this._stride / Arr.BYTES_PER_ELEMENT;
        Assert.isTrue( this._strideElem === Math.round( this._strideElem ) );
      }
      
      this._array = new Arr( this.bufferView.buffer._bytes, this.byteOffset + this.bufferView.getByteOffset(), this.count * this._strideElem );

    } else {
      this.bufferView     = null;
      this._stride        = 0;
      this._strideElem    = 0;
      this._array = this.createElementHolder();
    }


    this.sparse = null;
    if( data.sparse !== undefined ){
      // can't await sparse here because of cyclic dependency ( => sparse await accessor)
      gltfLoader._loadElement( data.sparse ).then( sparse=>this.sparse=sparse );
    }

    this._valueHolder = this.createElementHolder();
    this._normalizeFunc = getNormalizeFunction( this.componentType );

    return Promise.resolve();

  }
}
