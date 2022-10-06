precision mediump float;

varying highp vec3 vDirection;

#if IBL_FORMAT == PMREM
uniform samplerCube tTex;
#endif

#if IBL_FORMAT == OCTA

{{ require( "nanogl-pbr/glsl/includes/octwrap-decode.glsl" )() }}
uniform sampler2D tTex;
#endif

{{ require( "nanogl-pbr/glsl/includes/decode-rgbm.glsl" )() }}
#define DECODE_HDR( x ) decodeRGBM16( x )


#define PI 3.1415926
#define TAU 6.283184


void main(void){

  #if IBL_FORMAT == PMREM
    vec3 colorLinear = DECODE_HDR(textureCube(tTex, normalize(vDirection)));
    vec3 color = pow( colorLinear, vec3(1.0/2.2) );
    gl_FragColor = vec4( color, 1.0 );
  #endif

  #if IBL_FORMAT == OCTA

  vec2 tc = octwrapDecode(normalize(vDirection));

  const vec2 _IBL_UVM = vec2(
    0.25*(255.0/256.0),
    0.125*0.5*(255.0/256.0)
  );

  tc = tc * _IBL_UVM + vec2(
    0.5,
    0.125*0.5
  );

  // tc.y *= 0.125;
  vec4 tex = texture2D(tTex, tc);
  vec3 colorLinear = DECODE_HDR( tex );
  vec3 color = pow( colorLinear, vec3(1.0/2.2) );
  gl_FragColor = vec4( color, 1.0 );  
  #endif

}