

import  Buffer       from './Buffer'
import { GLContext } from 'nanogl/types';
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';


type ELEMENT_ARRAY_BUFFER = 0x8893 
type ARRAY_BUFFER = 0x8892
type ArrayBufferTarget = ELEMENT_ARRAY_BUFFER | ARRAY_BUFFER

export default class BufferView implements IElement {

  readonly gltftype : GltfTypes.BUFFERVIEW = GltfTypes.BUFFERVIEW;

  name        : undefined | string;
  extras      : any   ;
  
  byteOffset  = 0;
  byteLength  = 0;
  byteStride  = 0;
  target      = 0;
  buffer     : Buffer;

  private glBuffer   : WebGLBuffer = null;
  private glBufferTarget  = 0;

  async parse( gltfLoader:GltfLoader , data:Gltf2.IBufferView ) : Promise<any> {

    const {
      byteLength,
      byteOffset = 0,
      byteStride = 0,
      target     = 0
    } = data;

    this.byteLength = byteLength;
    this.byteOffset = byteOffset;
    this.byteStride = byteStride;
    this.target     = target;

    this.buffer  = await gltfLoader.getElement( GltfTypes.BUFFER, data.buffer );

  }


  getByteOffset():number{
    return this.byteOffset + this.buffer._byteOffset;
  }


  getWebGLBuffer( gl:GLContext, inferedTarget : ArrayBufferTarget ) : WebGLBuffer {

    if( this.target !== 0 && this.target !== inferedTarget ){
      throw new Error(`BufferView's target ${this.target} doesn't match infered one ${inferedTarget}` );
    }
    
    if( this.glBuffer !== null ){
      if( this.glBufferTarget !== inferedTarget ){
        // Is this really an error?
        throw new Error(`WebglBuffers with different target requested on BufferView` );
      }
    } else {

      const data = new Uint8Array( 
        this.buffer._bytes, 
        this.getByteOffset(), 
        this.byteLength 
      );
        
      this.glBufferTarget = inferedTarget;
      this.glBuffer = gl.createBuffer();

      gl.bindBuffer(inferedTarget, this.glBuffer);
      gl.bufferData(inferedTarget, data, gl.STATIC_DRAW );
      gl.bindBuffer(inferedTarget, null);

    }

    return this.glBuffer;
  }

 

}

 

