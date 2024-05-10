import { SimplexDNoise, SimplexNoise } from "./SimplexNoise";

export const CurlNoise =
/* wgsl */ `
${SimplexDNoise}

fn curlNoise( p: vec3f ) -> vec3f {

  var n = dnoise3D( p );

  return normalize( vec3f(
    n.y - n.z,
    n.z - n.x,
    n.x - n.y
  ) );
}

`