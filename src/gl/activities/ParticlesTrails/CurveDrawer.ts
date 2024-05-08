import { vec3, vec4 } from "gl-matrix";
import type CatmullCurve from "./CatmullCurve";

const V4A = vec4.create()
const V4B = vec4.create()
const V4C = vec4.create()
const V4D = vec4.create()

const V4_3A = V4A as any as vec3
const V4_3B = V4B as any as vec3
const V4_3C = V4C as any as vec3
const V4_3D = V4D as any as vec3



export default class CurveDrawer {

  segLength = 0.1

  constructor(readonly curve: CatmullCurve) {

  }


  update(cursor: vec3) {

    let numAnchors = this.curve.numAnchors;

    if (numAnchors === 0) {
      this.curve.addAnchor(cursor)
      this.curve.addAnchor(cursor)
      this.curve.addAnchor(cursor)
      this.curve.addAnchor(cursor)
    }

    else {
      this.curve.getAnchor(numAnchors - 3, V4A)
      let dist = vec3.distance(V4_3A, cursor)
      let c = 0

      do {

        vec3.subtract(V4_3B, cursor, V4_3A)
        vec3.normalize(V4_3B, V4_3B)
  
        if( numAnchors === 4 ){
          vec3.scaleAndAdd(V4_3C, V4_3A, V4_3B, -this.segLength)
          this.curve.setAnchorAt(0, V4_3C)
        }
  
        vec3.scaleAndAdd(V4_3D, V4_3A, V4_3B, this.segLength)
        this.curve.setAnchorAt(numAnchors - 2, V4_3D)
        
        vec3.scaleAndAdd(V4_3C, V4_3A, V4_3B, 2 * this.segLength)
        this.curve.setAnchorAt(numAnchors - 1, V4_3C)
        
        if( dist > this.segLength ){
          vec3.scaleAndAdd(V4_3C, V4_3A, V4_3B, 3 * this.segLength)
          this.curve.addAnchor(cursor)
          V4A.set( V4D )
          dist = vec3.distance(V4_3A, cursor)
          numAnchors = this.curve.numAnchors
        }
  
  
        if( c++ > 100 ){
          console.error('infinite loop')
          break;
        }

      }
      while (dist > this.segLength);



    }
  }


}