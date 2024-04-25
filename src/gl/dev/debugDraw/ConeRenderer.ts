import { mat4, vec3 } from 'gl-matrix'
import type { DebugDrawImpl } from './DebugDraw'

const M4 = mat4.create();
const V3_0 = vec3.create();
const V3_1 = vec3.create();
const V_ORIGIN = vec3.create();

const SVEC = vec3.create();

const CONE_SEGS = 16


export default class ConeRenderer {
  
  
  constructor(private debugDraw: DebugDrawImpl) {}
  
  
  addCone(worldMatrix: mat4, height: number, angle: number, colorHexRgb: number, segs = CONE_SEGS ) {

    const xyScale = height*Math.tan(angle)

    SVEC[0] = xyScale
    SVEC[1] = xyScale
    SVEC[2] = 1
    mat4.scale(M4, worldMatrix, SVEC )
    M4[12] += M4[8] * height
    M4[13] += M4[9] * height
    M4[14] += M4[10] * height

    this.debugDraw.circleRenderer.add( M4, 1, colorHexRgb )

    vec3.transformMat4( V3_0, V_ORIGIN, worldMatrix )

    for( let i = 0; i < segs; i++ ){

      const a = i / segs * Math.PI * 2

      V3_1[0] = Math.cos(a) * xyScale
      V3_1[1] = Math.sin(a) * xyScale
      V3_1[2] = height

      vec3.transformMat4( V3_1, V3_1, worldMatrix )
      
      this.debugDraw.lineRenderer.addLine( V3_0, V3_1, colorHexRgb )

    }

  }



}