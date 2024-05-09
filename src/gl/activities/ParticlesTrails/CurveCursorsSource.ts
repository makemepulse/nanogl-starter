import { quat, vec3, type vec4 } from "gl-matrix";
import Time from "../../core/Time";
import type GpuCurves from "./GpuCurves";

const Q_ID = quat.create()
const Q0 = quat.create()




export default class CurveCursorsSource {


  datas : Float32Array
  cursors : vec4[] = []
  units : vec3[] = []

  constructor( private curves: GpuCurves ) {
    this.datas = new Float32Array( curves.numCurves * 4 )
    for( let i = 0; i < curves.numCurves; i++ ){
      this.cursors.push( new Float32Array( this.datas.buffer, i*16, 3 ) as vec4 )
      this.units.push( vec3.fromValues(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ) )

    }
  }

  update( center: vec3){
    quat.rotateX( Q0, Q_ID, 0.1 * Time.seconds )
    quat.rotateY( Q0, Q0, 0.16 * Time.seconds )
    quat.rotateZ( Q0, Q0, 0.23 * Time.seconds )

    for( let i = 0; i < this.cursors.length; i++ ){
      let c = this.cursors[i] as any as vec3
      let u = this.units[i]
      vec3.transformQuat( c, u, Q0 )
      vec3.scaleAndAdd( c, center, c, .3 )
      c[3] = performance.now() * 0.00001
    }

    this.curves.setCursors( this.datas )

  }

}