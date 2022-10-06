
attribute vec3 aPosition;
attribute vec2 aTexCoord0;

varying lowp vec2 vTexCoord0;

uniform mat4 uMVP;

void main(void){
  gl_Position = uMVP * vec4( aPosition, 1.0 );
  vTexCoord0 = aTexCoord0;
}