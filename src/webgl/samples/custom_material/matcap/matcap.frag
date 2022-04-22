#pragma SLOT version

#pragma SLOT definitions


#ifndef hasNormals
  #define hasNormals 1
#endif 
#ifndef hasTangents
  #define hasTangents hasNormals
#endif 

#if hasTangents && !hasNormals 
  #pragma error tan but no nrm
  error
#endif


#if !hasTangents && __VERSION__ != 300
  #extension GL_OES_standard_derivatives : enable
#endif 

#pragma SLOT precision

{{ require( "nanogl-pbr/glsl/includes/glsl-compat.frag" )() }}

#pragma SLOT pf


uniform vec3 uCameraPosition;
IN vec3 vWorldPosition;

#if hasNormals
IN mediump vec3 vWorldNormal;
#endif 

#if HAS_normal && hasTangents
IN mediump vec3 vWorldTangent;
IN mediump vec3 vWorldBitangent;
#endif 


{{ require( "nanogl-pbr/glsl/includes/math.glsl" )() }}
{{ require( "nanogl-pbr/glsl/includes/color.glsl" )() }}
{{ require( "nanogl-pbr/glsl/includes/normals.glsl" )() }}

vec3 rotate( mat4 m, vec3 v )
{
  return m[0].xyz*v.x + m[1].xyz*v.y + m[2].xyz*v.z;
}


uniform mat4 uViewMatrix;
uniform sampler2D tMatcap;

//                MAIN
// ===================

void main( void ){

  #pragma SLOT f

  #if alphaMode( MASK )
    if( alpha() < alphaCutoff() ) discard;
  #endif


  #if alphaMode( MASK )
    FragColor.a = 1.0;
  #elif alphaMode( BLEND )
    FragColor.a = alpha();
  #else
    FragColor.a = 1.0;
  #endif

  vec3 worldNrm   = normalize(COMPUTE_NORMAL());
  vec3 viewNormal = normalize( rotate( uViewMatrix, worldNrm) );
  vec3 viewDir    = normalize( uCameraPosition - vWorldPosition );
  float grazing   = 1.0-sdot( worldNrm, -viewDir );
  vec2 matcapCoord = (viewNormal.xy * grazing) * vec2(0.5, -0.5) + 0.5;
  FragColor.rgb = texture2D( tMatcap, matcapCoord ).rgb;

  #pragma SLOT postf

}