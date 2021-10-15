import Accessor from "./Accessor";
import GltfLoader from "../io/GltfLoader";
import Gltf2 from "../types/Gltf2";
import GltfTypes from "../types/GltfTypes";
import AccessorSparseIndices from "./AccessorSparseIndices";
import AccessorSparseValues from "./AccessorSparseValues";
import { IElement } from "../types/Elements";
import { GLContext } from "nanogl/types";
import { TypedArray } from "../types/TypedArray";

export default class AccessorSparse implements IElement {


  readonly gltftype : GltfTypes.ACCESSOR_SPARSE = GltfTypes.ACCESSOR_SPARSE;
  name        : undefined | string;
  extras      : any   ;

  accessor:Accessor;
  indices :AccessorSparseIndices;
  values  :AccessorSparseValues;

  indicesSet:Set<number>;
  indicesMap:Map<number, number>;

  
  async parse( gltfLoader : GltfLoader, data : Gltf2.IAccessorSparse, ...args : any ) : Promise<any> {

    this.accessor = await gltfLoader.getElement( GltfTypes.ACCESSOR, data.elementParent.elementIndex );

    this.indices = await gltfLoader._loadElement( data.indices );
    this.values = await gltfLoader._loadElement( data.values );

    // this.indices.parse( loader, {
    //   uuid : "-internal-",
    //   gltftype : GltfTypes.ACCESSOR,
    //   bufferView   : iData   .bufferView ,
    //   byteOffset   : iData   .byteOffset ,
    //   componentType: iData   .componentType,
    //   count        : data    .count,
    //   normalized   : accessor.normalized,
    //   type         : Gltf2.AccessorType.SCALAR    
    // });
    
    // let vData = data.values;
    
    // this.values = new Accessor();
    // this.values.parse( loader, {
    //   uuid : "-internal-",
    //   gltftype : GltfTypes.ACCESSOR,
    //   bufferView   : vData   .bufferView ,
    //   byteOffset   : vData   .byteOffset ,
    //   count        : data    .count,
    //   componentType: accessor.componentType,
    //   normalized   : accessor.normalized,
    //   type         : accessor.type
    // });
    

    const iset = this.indicesSet = new Set();
    const imap = this.indicesMap = new Map();


    const indices = this.indices;
    const count = indices.count;
    
    for (let i = 0; i < count; i++) {
      const j = indices.getScalar( i )
      iset.add( j );
      imap.set( j, i );
    }

  }
  



  getRawValue( out:TypedArray, index: number ){
    const isSparse = this.indicesSet.has( index );
    if( isSparse ){
      this.values.getRawValue( out, this.indicesMap.get(index) );
    }else {
      this.accessor.getRawValue( out, index );
    }
  }

  // getRawValues( out:TypedArray, index: number, size : number ){

  //   for (let i = 0; i < size; i++) {
  //     const findex = index+i
  //     const isSparse = this.indicesSet.has( findex );
      
  //     if( isSparse ){
  //       this.values.getRawValue( out, this.indicesMap.get(findex) );
  //     }else {
  //       this.accessor.getRawValue( out, findex );
  //     }

  //   }
  // }

  
  getRawScalar(index:number) : number {
    const isSparse = this.indicesSet.has( index );
    if( isSparse ){
      return this.values.getRawScalar( this.indicesMap.get(index) )
    } else {
      return this.accessor.getRawScalar( index );
    }

  }



}