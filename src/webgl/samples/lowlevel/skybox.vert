precision lowp float;

attribute vec2 aPosition;

uniform mat4 uInverseViewProj;

varying lowp vec3 vViewDir;

void main( void ){
  vec4 pos = vec4( aPosition, 0.999, 1.0 );
  vViewDir = normalize( (uInverseViewProj * pos).xyz );
  gl_Position = pos;
}