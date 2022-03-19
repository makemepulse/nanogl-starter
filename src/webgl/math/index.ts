import { mat3, vec3, quat } from "gl-matrix";




const MAT3 = mat3.create();
const VX   = <vec3>new Float32Array( MAT3.buffer, 0*4, 3 );
const VY   = <vec3>new Float32Array( MAT3.buffer, 3*4, 3 );
const VZ   = <vec3>new Float32Array( MAT3.buffer, 6*4, 3 );
const VUP  = vec3.fromValues( 0, 1, 0 );


const PI2 = Math.PI*2.0;


export const DEG2RAD = Math.PI/180.0;

export const RAD2DEG = 1.0/DEG2RAD;


export function clamp01(n:number):number{
  return Math.min( 1.0, Math.max( 0.0, n ) );
}


export function clamp(n:number, min:number, max:number) : number {
  return Math.min( max, Math.max( min, n ) );
}


export function sign(n:number):number{
  return (n<0.0)?-1.0:1.0;
}

export function mix( a: number, b: number, m: number ): number {
  return a * (1.0-m) + b*m;
}


export function map( num: number, min1: number, max1: number, min2: number, max2: number ):number {
  const num1 = ( num - min1 ) / ( max1 - min1 )
  const num2 = ( num1 * ( max2 - min2 ) ) + min2
  return num2;
}


export function mapUnit( p: number, s: number, e: number ): number{
  const r = e-s;
  return clamp01(p/r - s/r)
}


export function randomFloat (minValue: number, maxValue: number):number {
  return Math.min(minValue + (Math.random() * (maxValue - minValue)), maxValue)
}


export function normalizeAngle(a: number):number{
  while( a >= PI2 ) a -= PI2
  while( a < 0.0  ) a += PI2
  return a;
}


export function normalizeDeltaAngle( angle: number, dest: number ):number{
  let   d0 = dest - angle;
  const d1 = d0 - PI2
  const d2 = d0 + PI2

  if( Math.abs( d1 ) < Math.abs( d0 ) ){
    d0 = d1 
  }
  if( Math.abs( d2 ) < Math.abs( d0 ) ){
    d0 = d2 
  }

  return angle+d0;
}


export function mat3Lookat( mat3 : mat3, dir : vec3 ):void {

  vec3.normalize( VZ, dir );
  vec3.cross( VX, VUP, VZ );
  vec3.normalize( VX, VX );
  vec3.cross( VY, VZ, VX );
  mat3.set( MAT3 );

}


export function quatSlerp( out: quat, a: number[], i1: number, i2: number, t: number ): quat{
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations

    const ax = a[i1+0], ay = a[i1+1], az = a[i1+2], aw = a[i1+3];
    let bx   = a[i2+0], by = a[i2+1], bz = a[i2+2], bw = a[i2+3];

    let        omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if ( cosom < 0.0 ) {
        cosom = -cosom;
        bx = - bx;
        by = - by;
        bz = - bz;
        bw = - bw;
    }
    // calculate coefficients
    if ( (1.0 - cosom) > 0.000001 ) {
        // standard case (slerp)
        omega  = Math.acos(cosom);
        sinom  = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {        
        // "from" and "to" quaternions are very close 
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    
    return out;
}

