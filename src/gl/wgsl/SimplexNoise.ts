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