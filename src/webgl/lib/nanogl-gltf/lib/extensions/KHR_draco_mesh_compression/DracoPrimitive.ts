import Primitive, { AttributesSet, Attribute } from "../../elements/Primitive";
import { GLContext } from "nanogl/types";
import GltfLoader from "../../io/GltfLoader";
import Gltf2 from "../../types/Gltf2";
import { IDracoGeometry } from "./DecoderAPI";
import GLIndexBuffer from 'nanogl/indexbuffer'
import GLArrayBuffer from 'nanogl/arraybuffer'
import Gltf from "../..";
import GltfTypes from "../../types/GltfTypes";


export default class DracoPrimitive extends Primitive {

  geometry: IDracoGeometry;
  

  setDatas(geometry: IDracoGeometry ) {
    this.geometry = geometry;

    // set attributes set with null Accessor
    // this.attributes = new AttributesSet();
    // for (const attrib of geometry.attributes) {
    //   this.attributes.add( new Attribute( attrib.semantic, null ) );
    // }
  }
  
  // async parse( gltfLoader:GltfLoader, data:Gltf2.IMeshPrimitive ) : Promise<any> {
 

  //   if( data.material !== undefined ){
  //     this.material = await gltfLoader.getElement( GltfTypes.MATERIAL, data.material );
  //   } else {
  //     this.material = await gltfLoader.loadDefaultMaterial();
  //   }

  //   if( data.mode !== undefined)
  //     this.mode = data.mode;
  //   else
  //     this.mode = Gltf2.MeshPrimitiveMode.DEFAULT;

  //   if( data.targets !== undefined ){
  //     this.targets = [];

  //     for (let i = 0; i < data.targets.length; i++) {
  //       const tgt = data.targets[i];
  //       const aset = new AttributesSet();
  //       await this.parseMorphAttributeSet( gltfLoader, aset, tgt, i );
  //       this.targets.push( aset );
  //     }
  //   }
    
  // }
  
  


  allocateGl( gl : GLContext ) : void {

    this._vaoMap = new Map();
    this.buffers = [];

    for (const attrib of this.geometry.attributes) {
      const glbuffer = new GLArrayBuffer( gl, attrib.buffer );
      glbuffer.attrib( 
        Gltf.getSemantics().getAttributeName( attrib.semantic ),
        attrib.numComps,
        attrib.componentType
      )
      this.buffers.push( glbuffer );
    }

    const indices = this.geometry.indices;
    if( indices !== null ){
      this.indexBuffer = new GLIndexBuffer( gl, indices.gltype, indices.buffer );
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


  render(){
    if( this.indexBuffer ){
      this.indexBuffer.draw( this.mode );
    }
    else 
      this.buffers[0].draw( this.mode );    
  }


}