import GLArrayBuffer from "nanogl/arraybuffer";
import IndexBuffer from "nanogl/indexbuffer";
import { GLContext } from "nanogl/types";
import { IGLContextProvider } from "./IGLContextProvider";
import { BytesResource } from "./Net";
import { Resource } from "./Resource";

export class BinGeom {
  vbuffer: GLArrayBuffer;
  ibuffer: IndexBuffer;

  constructor( gl : GLContext, vdata : Float32Array, idata: Uint16Array|null ){
    this.vbuffer = new GLArrayBuffer( gl, vdata )
    if( idata ){
      this.ibuffer = new IndexBuffer( gl, gl.UNSIGNED_SHORT, idata );
    }
  }

  dispose():void {
    this.vbuffer?.dispose()
    this.ibuffer?.dispose()
  }

}

export default class BinGeomResource extends Resource<BinGeom> {



  constructor( readonly path:string, readonly glp: IGLContextProvider ){
    super()
  }

  async doLoad(): Promise<BinGeom> {
    const bin = await (new BytesResource( this.path ).load());
    
    const vsize = new Uint32Array(bin)[0]
    const isize = bin.byteLength - vsize - 4

    const vdata = new Float32Array(bin, 4, vsize/4 )
    let idata = null;
    if( isize > 0 ) {
      idata = new Uint16Array(bin, 4+vsize, isize/2)
    }

    return new BinGeom( this.glp.gl, vdata, idata)
  }
  
  doUnload(): void {
    this.value?.dispose()
  }


}