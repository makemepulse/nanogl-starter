import { mat4, vec3 } from 'gl-matrix';
import type { DebugDrawImpl } from './DebugDraw';




const X_AXIS = vec3.fromValues(1,0,0);
const Y_AXIS = vec3.fromValues(0,1,0);
const Z_AXIS = vec3.fromValues(0,0,1);
const V3_0 = vec3.create();
const V3_1 = vec3.create();
const V_ORIGIN = vec3.create();

export default class AxisRenderer {

  constructor(private debugDraw: DebugDrawImpl) {}

  add( matrix: mat4 ): void {
    vec3.transformMat4( V3_0, V_ORIGIN, matrix )

    vec3.transformMat4( V3_1, X_AXIS, matrix )
    this.debugDraw.lineRenderer.addLine( V3_0, V3_1, 0xff0000 )

    vec3.transformMat4( V3_1, Y_AXIS, matrix )
    this.debugDraw.lineRenderer.addLine( V3_0, V3_1, 0x00ff00 )

    vec3.transformMat4( V3_1, Z_AXIS, matrix )
    this.debugDraw.lineRenderer.addLine( V3_0, V3_1, 0x0000ff )

  }

}