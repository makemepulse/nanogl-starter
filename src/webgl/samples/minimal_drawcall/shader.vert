
attribute float aAngle;
attribute vec2 aPosition;

uniform mat4 uMVP;
uniform vec2 uParams;

#define Radius uParams.x
#define Arc uParams.y

void main(void){
gl_Position = uMVP * vec4( Radius*cos(aAngle*Arc), 0.0, Radius*sin(aAngle*Arc), 1.0);
}