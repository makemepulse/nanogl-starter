
attribute float aAngle;
attribute vec2 aPosition;

uniform mat4 uMVP;
uniform float uRadius;
uniform float uArc;

void main(void){
  gl_Position = uMVP * vec4( uRadius*cos(aAngle*uArc), 0.0, uRadius*sin(aAngle*uArc), 1.0);
}