// This is a modified wgsl version from https://github.com/ashima/webgl-noise/blob/master/src/noise3D.glsl
// 
// Author: Ian McEwan, Ashima Arts
// GitHub: https://github.com/ashima/webgl-noise
//         https://github.com/stegu/webgl-noise
// Original License:
//   MIT License
//   Copyright (C) 2011 Ashima Arts
//   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//   The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// This modification is also licensed under the MIT License.
//
// MIT License
// Copyright © 2023 Zaron Chen (Ported to WGSL)
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


export const SimplexDNoise = 
/* wgsl */ `


/* skew constants for 3d simplex functions */
const F3 =  0.3333333;
const G3 =  0.1666667;

fn quat_times_vec(q: vec4f, v: vec3f) -> vec3f
{
	//http://molecularmusings.wordpress.com/2013/05/24/a-faster-quaternion-vector-multiplication/
	var t: vec3f = 2. * cross(q.xyz, v);
	return v + q.w * t + cross(q.xyz, t);
}

/* Created by Nikita Miropolskiy, nikat/2013
 * This work is licensed under a 
 * Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *  - You must attribute the work in the source code 
 *    (link to https://www.shadertoy.com/view/XsX3zB).
 *  - You may not use this work for commercial purposes.
 *  - You may distribute a derivative work only under the same license.
 */

/* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
fn random3(c: vec3f ) -> vec3f
{
	var j: f32 = 4096.0 * sin(dot(c,vec3f(17.0, 59.4, 15.0)));
	var r : vec3f;
	r.z = fract(512.0*j);
	j *= .125;
	r.x = fract(512.0*j);
	j *= .125;
	r.y = fract(512.0*j);
	r = r - 0.5;

	
	//rotate for extra flow!
	// r=quat_times_vec(quat,r);
	
	return r;
}


fn dnoise3D(p: vec3f)  -> vec4f
{
	 /* 1. find current tetrahedron T and its four vertices */
	 /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
	 /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/
	 
	 var s: vec3f = floor(p + (p.x+p.y+p.z)*F3);
	 var x: vec3f = p - s + (s.x+s.y+s.z)*G3;
	 
	 var e: vec3f = step(vec3f(0.0), x - x.yzx);
	 var i1: vec3f = e*(1.0 - e.zxy);
	 var i2: vec3f = 1.0 - e.zxy*(1.0 - e);
	 	
	 var x1: vec3f = x - i1 + G3;
	 var x2: vec3f = x - i2 + 2.0*G3;
	 var x3: vec3f = x - 1.0 + 3.0*G3;
	 		 
	 /* calculate surflet weights */
	 var w: vec4f;;
	 w.x = dot(x, x);
	 w.y = dot(x1, x1);
	 w.z = dot(x2, x2);
	 w.w = dot(x3, x3);
	 
	 /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
	 w = max(0.6 - w, vec4f(0.0));		//aka t0,t1,t2,t3
	 var w2: vec4f = w*w;				//aka t20,t21,t22,t23
	 var w4: vec4f = w2*w2;			//aka t40,t41,t42,t43
	 
	 /* 2. find four surflets and store them in d */
	 var g0 : vec3f = random3(s);
	 var g1 : vec3f = random3(s + i1);
	 var g2 : vec3f = random3(s + i2);
	 var g3 : vec3f = random3(s + 1.0);
	 
	 var d: vec4f;
	 /* calculate surflet components */
	 d.x = dot(g0, x);		//aka graddotp3( gx0, gy0, gz0, x0, y0, z0 )
	 d.y = dot(g1, x1);
	 d.z = dot(g2, x2);
	 d.w = dot(g3, x3);
	 
	 //derivatives as per
	 //http://webstaff.itn.liu.se/~stegu/aqsis/flownoisedemo/srdnoise23.c
	 var w3: vec4f = w*w2;
	 var temp: vec4f = w3*d;
	 var dnoise: vec3f = temp[0]*x;
	     dnoise += temp[1]*x1;
	     dnoise += temp[2]*x2;
		 dnoise += temp[3]*x3;
		 dnoise *= -8.;
		 dnoise += w4[0]*g0+w4[1]*g1+w4[2]*g2+w4[3]*g3;
		 dnoise *= 52.; //???
		 
	 d *= w4;	//aka n0,n1,n2,n3
	 
	var n: f32 = (d.x+d.y+d.z+d.w)*52.;
	
	return vec4f(dnoise,n);
}

`
export const SimplexNoise = 
/* wgsl */ `

fn mod289v3f(x: vec3f)        -> vec3f { return x - floor(x / 289.0) * 289.0; }
fn mod289v4f(x: vec4f)        -> vec4f { return x - floor(x / 289.0) * 289.0; }
fn permute289v4f(x: vec4f)    -> vec4f { return mod289v4f(((x*34.0)+10.0)*x); }
fn taylorInvSqrtv4f(r: vec4f) -> vec4f { return 1.79284291400159 - 0.85373472095314 * r; }

fn snoise3D(v: vec3f) -> f32 {
  let C = vec2f(1./6., 1./3.);
  let D = vec4f(0., .5, 1., 2.);

  var i = floor(v + dot(v, C.yyy));
  var x0 = v - i + dot(i, C.xxx);

  var g = step(x0.yzx, x0.xyz);
  var l = 1.0 - g;
  var i1 = min( g.xyz, l.zxy );
  var i2 = max( g.xyz, l.zxy );

  var x1 = x0 - i1 + C.xxx;
  var x2 = x0 - i2 + C.yyy;
  var x3 = x0 - D.yyy;

  i = mod289v3f(i);
  var p = permute289v4f( permute289v4f( permute289v4f(
            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  var n_ = 0.142857142857;
  var ns = n_ * D.wyz - D.xzx;

  var j = p - 49.0 * floor(p * ns.z * ns.z);

  var x_ = floor(j * ns.z);
  var y_ = floor(j - 7.0 * x_ );

  var x = x_ *ns.x + ns.yyyy;
  var y = y_ *ns.x + ns.yyyy;
  var h = 1.0 - abs(x) - abs(y);

  var b0 = vec4f( x.xy, y.xy );
  var b1 = vec4f( x.zw, y.zw );

  var s0 = floor(b0)*2.0 + 1.0;
  var s1 = floor(b1)*2.0 + 1.0;
  var sh = -step(h, vec4(0.0));

  var a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  var a1 = b1.xzyw + s1.xzyw*sh.zzww;

  var p0 = vec3f( a0.xy, h.x );
  var p1 = vec3f( a0.zw, h.y );
  var p2 = vec3f( a1.xy, h.z );
  var p3 = vec3f( a1.zw, h.w );

  var norm = taylorInvSqrtv4f( vec4f( dot( p0, p0 ), dot( p1, p1 ), dot( p2, p2 ), dot( p3, p3 ) ));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  var m = max(0.5 - vec4f( dot( x0, x0 ), dot( x1, x1 ), dot( x2, x2 ), dot( x3, x3 ) ), vec4f(0.0));
  m = m * m;

  return 105.0 * dot( m*m, vec4f( dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3) ));
}
`;