#pragma SLOT version

#pragma SLOT definitions


/**
 * AA Basically a copy past of nanogl-pbr "snadard.frag" shader
 * here we replace the BRDFData structure and setup to add clearcoat related values, used by the modified lighting functions in `lighting.glsl`
 */


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
{{ require( "nanogl-pbr/glsl/includes/pbr-inputs-decl.glsl" )() }}

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




struct GeometryData
{
    vec3  worldPos;
    mediump vec3   worldNrm;
    mediump vec3   viewDir;
    mediump vec3   worldReflect;
};


struct LightingData
{
  lowp vec3 lightingColor;
};



{{ require( "nanogl-pbr/glsl/includes/math.glsl" )() }}
{{ require( "nanogl-pbr/glsl/includes/color.glsl" )() }}
{{ require( "nanogl-pbr/glsl/includes/normals.glsl" )() }}
{{ require( "nanogl-pbr/glsl/includes/tonemap.glsl" )() }}
// substitue lighting part
{{ require( "./lighting.glsl" )() }}



void InitializeLightingData(out LightingData lightingData)
{
  lightingData.lightingColor = vec3(0.0);
}


void InitializeBRDF(SurfaceData surface, out BRDFData brdf)
{
    mediump float reflectivity = ReflectivitySpecular(surface.specular);
    mediump float oneMinusReflectivity = 1.0 - reflectivity;

    brdf.diffuse = surface.albedo * (vec3(1.0, 1.0, 1.0) - surface.specular);
    brdf.specular = surface.specular;

    brdf.grazingTerm = saturate(surface.smoothness + reflectivity);
    brdf.perceptualRoughness = PerceptualSmoothnessToPerceptualRoughness(surface.smoothness);
    brdf.roughness = max(PerceptualRoughnessToRoughness(brdf.perceptualRoughness), 0.001);
    brdf.roughness2 = brdf.roughness * brdf.roughness;

    brdf.normalizationTerm = brdf.roughness * 4.0 + 2.0;
    brdf.roughness2MinusOne = brdf.roughness2 - 1.0;


    brdf.perceptualRoughness_CC = PerceptualSmoothnessToPerceptualRoughness(ClearcoatSmoothness());
    float roughness_CC = max(PerceptualRoughnessToRoughness(brdf.perceptualRoughness_CC), 0.001);
    brdf.roughness2_CC = roughness_CC * roughness_CC;
    brdf.grazingTerm_CC = saturate(ClearcoatSmoothness() + 0.04);

    brdf.normalizationTerm_CC = roughness_CC * 4.0 + 2.0;
    brdf.roughness2MinusOne_CC = brdf.roughness2_CC - 1.0;

}

//                MAIN
// ===================

void main( void ){

  #pragma SLOT f


  SurfaceData surface;
  #pragma SLOT pbrsurface

  #if alphaMode( MASK )
    if( surface.alpha < alphaCutoff() ) discard;
  #endif

  //
  #ifdef HAS_vertexColor
  #if HAS_vertexColor
    surface.albedo *= vertexColor();
  #endif
  #endif


  // -----------

  GeometryData geometryData;
  geometryData.worldPos = vWorldPosition;
  geometryData.viewDir  = normalize( uCameraPosition - vWorldPosition );
  geometryData.worldNrm = normalize(COMPUTE_NORMAL());
  geometryData.worldReflect = reflect( -geometryData.viewDir, geometryData.worldNrm );


  BRDFData brdfData;
  InitializeBRDF( surface, brdfData );

  LightingData lightingData;
  InitializeLightingData( lightingData );




  #pragma SLOT prelightsf
  #pragma SLOT lightsf
  #pragma SLOT postlightsf

  lightingData.lightingColor += surface.emission;


  #if alphaMode( MASK )
    FragColor.a = 1.0;
  #elif alphaMode( BLEND )
    FragColor.a = surface.alpha;
  #else
    FragColor.a = 1.0;
  #endif



  FragColor.rgb = lightingData.lightingColor;

  #pragma SLOT postf_linear

  EXPOSURE(FragColor.rgb);
  GAMMA_CORRECTION(FragColor.rgb);

  #pragma SLOT postf



}