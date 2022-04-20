/**
 * altered version of lighting.glsl from nanogl-pbr
 * used a modified version of BRDFData to add clearcoat effect to the brdf calculations, for punctual lights and IBLs
 */

struct Light
{
  mediump vec3   direction;
  mediump vec3   color;
  mediump float  attenuation;
  mediump float  shadowAttenuation;
};



float DistanceAttenuation(float distanceSqr)
{
  return 1.0/distanceSqr;
}

float DistanceAttenuationRange(float distanceSqr, vec2 distanceAttenuation)
{
  float factor = distanceSqr * distanceAttenuation.x; // x = 1/range squared
  float smoothFactor = saturate(1.0 - factor * factor);
  smoothFactor = smoothFactor * smoothFactor;

  float lightAtten = 1.0/distanceSqr;
  return lightAtten * smoothFactor;
}


mediump float AngleAttenuation(vec3 spotDirection, vec3 lightDirection, vec2 spotAttenuation)
{
  mediump float SdotL = dot(spotDirection, lightDirection);
  mediump float atten = saturate(SdotL * spotAttenuation.x + spotAttenuation.y);
  return atten * atten;
}




mediump float ReflectivitySpecular(mediump vec3 specular)
{
  #ifdef QUALITY_HI
    return max(max(specular.r, specular.g), specular.b);
  #else
    return specular.r;
  #endif
}

#define PerceptualSmoothnessToPerceptualRoughness(perceptualSmoothness) (1.0 - perceptualSmoothness)
#define PerceptualRoughnessToRoughness(perceptualRoughness) (perceptualRoughness * perceptualRoughness)




// Schlick approx
// [Schlick 1994, "An Inexpensive BRDF Model for Physically-Based Rendering"]
// https://github.com/EpicGames/UnrealEngine/blob/dff3c48be101bb9f84633a733ef79c91c38d9542/Engine/Shaders/BRDF.usf#L168
vec3 F_Schlick( float VoH,vec3 spec,float glo )
{
  float factor = glo*glo * pow( 1.0-VoH, 5.0 );
  return( 1.0 - factor )*spec + factor;
}


mediump vec3 LightingLambert(mediump vec3 lightColor, mediump vec3 lightDir, mediump vec3 normal)
{
    mediump float NoL = sdot(normal, lightDir);
    return lightColor * NoL;
}

mediump vec3 LightingSpecular(mediump vec3 lightColor, vec3 lightDir, mediump vec3 normal, vec3 viewDir, mediump vec4 specular, mediump float smoothness)
{
    vec3 halfVec = normalize(lightDir + viewDir);
    mediump float NoH = sdot(normal, halfVec);
    mediump float modifier = pow(NoH, smoothness);
    mediump vec3 specularReflection = specular.rgb * modifier;
    return lightColor * specularReflection;
}






struct BRDFData
{
  mediump vec3 diffuse;
  mediump vec3 specular;
  mediump float perceptualRoughness;
  mediump float roughness;
  mediump float grazingTerm;

    // We save some light invariant BRDF terms so we don't have to recompute
    // them in the light loop. Take a look at DirectBRDF function for detailed explaination.
  mediump float roughness2;
  mediump float normalizationTerm;     // roughness * 4.0 + 2.0
  mediump float roughness2MinusOne;    // roughness^2 - 1.0
  
  // clearcoat additive
  mediump float perceptualRoughness_CC;
  mediump float grazingTerm_CC;
  mediump float roughness2_CC;
  mediump float normalizationTerm_CC;     // roughness * 4.0 + 2.0
  mediump float roughness2MinusOne_CC;    // roughness^2 - 1.0
};


#define DIELECTRIC_SPEC 0.04
#define DIELECTRIC_OMS (1.0-0.04)

// "Optimizing PBR for Mobile" from Siggraph 2015 moving mobile graphics course 
// https://community.arm.com/events/1155

mediump vec3 GGXZiomaBDRF(BRDFData brdfData, mediump vec3 normalWS, mediump vec3 wLightDir, mediump vec3 wViewDir)
{
  vec3 halfDir = normalize(wLightDir + wViewDir);
  float NoH = sdot(normalWS, halfDir);
  mediump float LoH = sdot(wLightDir, halfDir);
  mediump float LoH2 = LoH * LoH;
  float d = NoH * NoH * brdfData.roughness2MinusOne + 1.00001;
  mediump float specularTerm = brdfData.roughness2 / ((d * d) * max(0.1, LoH2) * brdfData.normalizationTerm);
  mediump vec3 brdf = specularTerm * brdfData.specular + brdfData.diffuse;

  // clearcoat

  d = NoH * NoH * brdfData.roughness2MinusOne_CC + 1.00001;
  specularTerm = brdfData.roughness2_CC / ((d * d) * max(0.1, LoH2) * brdfData.normalizationTerm_CC);
  mediump float brdfCC = specularTerm * DIELECTRIC_SPEC;
  mediump float NoV = saturate(dot(normalWS, wViewDir));
  mediump float oneMinusNoV4 = 1.0 - NoV;
  oneMinusNoV4 = oneMinusNoV4*oneMinusNoV4;
  oneMinusNoV4 = oneMinusNoV4*oneMinusNoV4;
  mediump float coatFresnel = DIELECTRIC_SPEC + DIELECTRIC_OMS * oneMinusNoV4;


  brdf = brdf * (1.0 - coatFresnel) + brdfCC;
  brdf = brdf*2.0;
  return brdf;
}



void LightingPhysicallyBased(BRDFData brdfData, GeometryData geometryData, inout LightingData lightingData, Light light )
{
  mediump float NdotL = sdot(geometryData.worldNrm, light.direction);
  mediump vec3 inputLight = light.color * (light.attenuation * light.shadowAttenuation * NdotL);
  lightingData.lightingColor += GGXZiomaBDRF(brdfData, geometryData.worldNrm, light.direction, geometryData.viewDir) * inputLight;
}


void EnvironmentBRDF(BRDFData brdfData, GeometryData geometryData, inout LightingData lightingData, float occlusion )
{

  vec3 indirectDiffuse = ComputeIBLDiffuse( geometryData.worldNrm );
  vec3 indirectSpecular = SpecularIBL( geometryData.worldReflect, brdfData.perceptualRoughness );

  float NoV = sdot( geometryData.viewDir, geometryData.worldNrm );
  float fresnelTerm = pow( 1.0-NoV, 5.0 );

  float surfaceReduction = 1.0 / (brdfData.roughness2 + 1.0);
  vec3 specularTerm = vec3(surfaceReduction * mix(brdfData.specular, vec3(brdfData.grazingTerm), fresnelTerm));

  vec3 color = indirectDiffuse * brdfData.diffuse + indirectSpecular*specularTerm;

  // add Clearcoat
  vec3 indirectSpecular_CC = SpecularIBL( geometryData.worldReflect, brdfData.perceptualRoughness_CC );

  surfaceReduction = 1.0 / (brdfData.roughness2_CC + 1.0);
  float specularTerm_CC = surfaceReduction * mix(DIELECTRIC_SPEC, brdfData.grazingTerm_CC, fresnelTerm);

  vec3 coatColor = indirectSpecular_CC * specularTerm_CC;


  float coatFresnel = DIELECTRIC_SPEC + DIELECTRIC_OMS * fresnelTerm;

  lightingData.lightingColor += (color * (1.0 - coatFresnel) + coatColor) * occlusion;
}