precision mediump float;

varying lowp vec3 vViewDir;
uniform sampler2D tEnv;

#define PI 3.1415926
#define TAU 6.283184


vec2 viewDirToLatLong(vec3 viewDir) {
  vec2 latLong;
  latLong.x = -atan(viewDir.x, viewDir.z)/TAU;
  latLong.y = - asin(viewDir.y)/PI + .5;
  return latLong;
}


void main( void ){
  vec3 viewDir = normalize( vViewDir );
  gl_FragColor = texture2D( tEnv, viewDirToLatLong(viewDir) );
}