
// attribute vec3 aPosition;
attribute vec2 aTexCoord0;

varying {{@highp}} vec3 vDirection;

uniform mat4 uMVP;
uniform vec3 uParams;

#define radius uParams.x
#define cornerRadius uParams.y
#define projHeight uParams.z

#define PI 3.141592653
#define PI_2 1.57079

#define P1 0.3
#define P2 0.5


void main(void){
  float u = aTexCoord0.x * 2.0;
  float v = aTexCoord0.y;

  float y;
  float x;

  if( v < P1 ){
    float p = v/P1;
    y = cornerRadius + radius * cos( p * PI_2 );
    x = radius * sin( p * PI_2 );
    
  } else if ( v < P2 ){
    float p = (v-P1)/(P2-P1);
    y = cornerRadius - cornerRadius * sin( p * PI_2 );
    x = radius - cornerRadius * (1.0-cos( p * PI_2 ));
  } else {
    float p = (v-P2)/(1.0-P2);
    y = 0.0;
    x = (radius - cornerRadius) * ( 1.0-p );
  }

  vec3 pos = vec3( x*cos(u*PI), y, x*sin(u*PI) );

  gl_Position = uMVP * vec4( pos, 1.0 );

  vDirection = pos - vec3( 0.0, projHeight, 0.0 );
}