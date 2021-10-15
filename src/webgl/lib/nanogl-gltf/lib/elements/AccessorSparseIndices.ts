import GltfTypes from "../types/GltfTypes";
import GltfLoader from "../io/GltfLoader";
import Gltf2 from "../types/Gltf2";
import { BaseAccessor, getArrayForDataType } from "./Accessor";
import Assert from "../lib/assert";
import { IElement } from "../types/Elements";

export default class AccessorSparseIndices extends BaseAccessor implements IElement {

  readonly gltftype : GltfTypes.ACCESSOR_SPARSE_INDICES = GltfTypes.ACCESSOR_SPARSE_INDICES;
  name        : undefined | string;
  extras      : any   ;

  async parse( gltfLoader : GltfLoader, data : Gltf2.IAccessorSparseIndices ) : Promise<any> {

    const sparseData : Gltf2.IAccessorSparse = data.elementParent as Gltf2.IAccessorSparse;
      

    this.normalized     = false;
    this.byteOffset     = data.byteOffset ?? 0;
    
    this.componentType  = data.componentType;
    this.count          = sparseData.count;
    this.type           = Gltf2.AccessorType.SCALAR;
    
    this.sparse = null;
    
    
    
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
    
    this._valueHolder = this.createElementHolder();

    return Promise.resolve();
    
  }

}