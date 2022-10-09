#pragma SLOT version

#pragma SLOT definitions

#if __VERSION__ == 300
  precision lowp sampler2DShadow;

  #define DepthSampler sampler2DShadow
  
#else
  #define DepthSampler sampler2D
#endif



#pragma SLOT precision

{{ require( "nanogl-pbr/glsl/includes/glsl-compat.frag" )() }}

#pragma SLOT pf


// uniform vec3 uCameraPosition;
IN vec3 vWorldPosition;
IN mediump vec3 vWorldNormal;




struct GeometryData
{
    vec3  worldPos;
    mediump vec3   worldNrm;
    mediump vec3   viewDir;
    mediump vec3   worldReflect;
};



#define HAS_normal 0
#define hasNormals 1

{{ require( "nanogl-pbr/glsl/includes/math.glsl" )() }}
{{ require( "nanogl-pbr/glsl/includes/color.glsl" )() }}
{{ require( "nanogl-pbr/glsl/includes/normals.glsl" )() }}


// uniform float uSampleIndex;
uniform float uSampleWeight;


mediump float AngleAttenuation(vec3 spotDirection, vec3 lightDirection, vec2 spotAttenuation)
{
  mediump float SdotL = dot(spotDirection, lightDirection);
  mediump float atten = saturate(SdotL * spotAttenuation.x + spotAttenuation.y);
  return atten * atten;
}

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





#define SHADOW_COUNT 1


uniform highp vec2 uShadowKernelRotation;
uniform DepthSampler tShadowMap;
uniform highp mat4 uShadowMatrix;
uniform highp vec4 uShadowTexelBiasVector;
uniform       vec2 uShadowMapSize;


struct ShadowMapData {
  mat4 projection;
  vec4 texelBiasVector;
  vec2 size; // size , 1/size
};

#define GET_SHADOWMAP_DATA(i) ShadowMapData( uShadowMatrix, uShadowTexelBiasVector, uShadowMapSize)


// RGB depth decoding
// ------------------
highp float decodeDepthRGB(highp vec3 rgb){
  return(rgb.x+rgb.y*(1.0/255.0))+rgb.z*(1.0/65025.0);
}


#if __VERSION__ == 300
  
      
  float textureShadow( DepthSampler t, float ref, vec2 uvs ){
    return texture(t, vec3( uvs, ref ) );
  }

  vec2 textureShadow( DepthSampler t, float ref, vec4 uvs ){
    
    return vec2(
      texture(t, vec3( uvs.xy, ref ) ),
      texture(t, vec3( uvs.zw, ref ) )
    );

  }

  vec4 textureShadow( DepthSampler t, float ref, vec4 uvs0, vec4 uvs1 ){
    
    return vec4(
      texture(t, vec3( uvs0.xy, ref ) ),
      texture(t, vec3( uvs0.zw, ref ) ),
      texture(t, vec3( uvs1.xy, ref ) ),
      texture(t, vec3( uvs1.zw, ref ) )
    );

  }



#else



  #if depthFormat( D_RGB )
    float FETCH_DEPTH( DepthSampler t, vec2 uvs ){
      return decodeDepthRGB( texture2D(t,uvs).xyz );
    }
    //define FETCH_DEPTH(t,uvs) decodeDepthRGB( texture2D(t,uvs).xyz )
  #endif

  #if depthFormat( D_DEPTH )
    float FETCH_DEPTH( DepthSampler t, vec2 uvs ){
      return texture2D(t,uvs).x;
    }
    //define FETCH_DEPTH(t,uvs) texture2D(t,uvs).x
  #endif

  
  float textureShadow( DepthSampler t, float ref, vec2 uvs ){
    return step( ref, FETCH_DEPTH(t,uvs));
  }

  vec2 textureShadow( DepthSampler t, float ref, vec4 uvs ){
    
    vec2 occl = vec2(
      FETCH_DEPTH(t,uvs.xy),
      FETCH_DEPTH(t,uvs.zw)
    );

    return step( vec2(ref), occl );
  }

  vec4 textureShadow( DepthSampler t, float ref, vec4 uvs0, vec4 uvs1 ){
    
    vec4 occl = vec4(
      FETCH_DEPTH(t,uvs0.xy),
      FETCH_DEPTH(t,uvs0.zw),
      FETCH_DEPTH(t,uvs1.xy),
      FETCH_DEPTH(t,uvs1.zw)
    );

    return step( vec4(ref), occl );
  }

#endif




float resolveShadowNoFiltering(highp float fragZ, DepthSampler depth,highp vec2 uv ){
    return textureShadow( depth, fragZ, uv );
}

#if __VERSION__ == 300
  // Bilinear is natively supported in ES3
  // Shadowmap filtering must be set by sampler2DShadow filter parameter

  float resolveShadow2x1(highp float fragZ, DepthSampler depth,highp vec2 uv, vec2 mapSize ){
    return textureShadow( depth, fragZ, uv );
  }

  float resolveShadow2x2(highp float fragZ, DepthSampler depth,highp vec2 uv, vec2 mapSize ){
    return textureShadow( depth, fragZ, uv );
  }

#else

  float resolveShadow2x1(highp float fragZ, DepthSampler depth,highp vec2 uv, vec2 mapSize ){

    highp float coordsPx = uv.x*mapSize.x;
    highp float uvMin = floor( coordsPx ) * mapSize.y;
    highp float uvMax = ceil(  coordsPx ) * mapSize.y;

    vec2 occl = textureShadow( depth, fragZ, vec4(
      uvMin,uv.y,
      uvMax,uv.y
    ));

    highp float ratio = coordsPx - uvMin*mapSize.x;
    return ( ratio * occl.y + occl.x ) - ratio * occl.x;

  }

  float resolveShadow2x2(highp float fragZ, DepthSampler depth,highp vec2 uv, vec2 mapSize ){

    highp vec2 coordsPx = uv*mapSize.x;
    highp vec2 uvMin=floor( coordsPx ) *mapSize.y;
    highp vec2 uvMax=ceil(  coordsPx ) *mapSize.y;

    vec4 occl = textureShadow( depth, fragZ, 
      vec4(
        uvMin,
        vec2(uvMax.x,uvMin.y)
      ),
      vec4(
        vec2(uvMin.x,uvMax.y),
        uvMax
      )
    );

    highp vec2 ratio = coordsPx - uvMin*mapSize.x;
    vec2  t = ( ratio.y * occl.zw + occl.xy ) - ratio.y * occl.xy;

    return(ratio.x*t.y+t.x)-ratio.x*t.x;
  }

#endif


float calcLightOcclusions(DepthSampler depth, highp vec3 fragCoord, vec2 mapSize ){
  float s;

  highp vec2 kernelOffset = uShadowKernelRotation * mapSize.y;

  // NO FILTER
  #if shadowFilter( PCFNONE )

    s = resolveShadowNoFiltering( fragCoord.z, depth, fragCoord.xy );
  #endif

  // PCF4x1
  #if shadowFilter( PCF4x1 )

    s = resolveShadowNoFiltering( fragCoord.z, depth, fragCoord.xy + kernelOffset                    );
    s+= resolveShadowNoFiltering( fragCoord.z, depth, fragCoord.xy - kernelOffset                    );
    s+= resolveShadowNoFiltering( fragCoord.z, depth, fragCoord.xy + vec2(-kernelOffset.y,kernelOffset.x)  );
    s+= resolveShadowNoFiltering( fragCoord.z, depth, fragCoord.xy + vec2(kernelOffset.y,-kernelOffset.x)  );
    s /= 4.0;
  #endif

  // PCF4x4
  #if shadowFilter( PCF4x4 )

    s = resolveShadow2x2( fragCoord.z, depth, fragCoord.xy + kernelOffset                         , mapSize );
    s+= resolveShadow2x2( fragCoord.z, depth, fragCoord.xy - kernelOffset                         , mapSize );
    s+= resolveShadow2x2( fragCoord.z, depth, fragCoord.xy + vec2(-kernelOffset.y,kernelOffset.x) , mapSize );
    s+= resolveShadow2x2( fragCoord.z, depth, fragCoord.xy + vec2(kernelOffset.y,-kernelOffset.x) , mapSize );
    s /= 4.0;
  #endif

  // PCF2x2
  #if shadowFilter( PCF2x2 )

    s = resolveShadow2x1( fragCoord.z, depth, fragCoord.xy + kernelOffset , mapSize);
    s+= resolveShadow2x1( fragCoord.z, depth, fragCoord.xy - kernelOffset , mapSize);
    s /= 2.0;
  #endif


  if( any( greaterThan( abs( fragCoord - vec3(.5) ), vec3(.5) ) ) ){
    s = 1.0;
  }

  return s;

}

// float3 ApplyShadowBias(float3 positionWS, float3 normalWS, float3 lightDirection)
// {
//     float invNdotL = 1.0 - saturate(dot(lightDirection, normalWS));
//     float scale = invNdotL * _ShadowBias.y;

//     // normal bias is negative since we want to apply an inset normal offset
//     positionWS = lightDirection * _ShadowBias.xxx + positionWS;
//     positionWS = normalWS * scale.xxx + positionWS;
//     return positionWS;
// }

vec3 calcShadowPosition( vec4 texelBiasVector, mat4 shadowProjection, vec3 worldPos, vec3 worldNormal, float invMapSize )
{
  float WoP = dot( texelBiasVector, vec4( worldPos, 1.0 ) );

  WoP *= .0005+2.0*invMapSize;

  highp vec4 fragCoord = shadowProjection * vec4( worldPos + WoP * worldNormal, 1.0);
  return fragCoord.xyz / fragCoord.w;
}



vec3 calcShadowPosition( ShadowMapData shadowmap, vec3 worldPos, vec3 worldNormal )
{
  float WoP = dot( shadowmap.texelBiasVector, vec4( worldPos, 1.0 ) );

  WoP *= .005+2.0*shadowmap.size.y;

  highp vec4 fragCoord = shadowmap.projection * vec4( worldPos + WoP * worldNormal, 1.0);
  return fragCoord.xyz / fragCoord.w;
}


mediump float SampleShadowAttenuation( ShadowMapData shadowmap, DepthSampler texture, vec3 worldPos, vec3 worldNormal  ) {
  highp vec3 coords = calcShadowPosition( shadowmap, worldPos, worldNormal );
  return calcLightOcclusions( texture, coords, shadowmap.size );
}





//                MAIN
// ===================

void main( void ){

  #pragma SLOT f

  // -----------

  GeometryData geometryData;
  geometryData.worldPos = vWorldPosition;
  // geometryData.viewDir  = normalize( uCameraPosition - vWorldPosition ); // safe normalize?
  geometryData.worldNrm = normalize(COMPUTE_NORMAL());
  // geometryData.worldReflect = reflect( -geometryData.viewDir, geometryData.worldNrm );

  ShadowMapData shadowmapData = GET_SHADOWMAP_DATA();
  float shadowAttenuation = SampleShadowAttenuation(shadowmapData, tShadowMap, geometryData.worldPos, geometryData.worldNrm );

  #pragma SLOT prelightsf
  #pragma SLOT lightsf
  #pragma SLOT postlightsf


  // FragColor.rgb = vec3(shadowAttenuation * NdotL);
  FragColor.rgb = vec3(shadowAttenuation*uSampleWeight);

  FragColor.a = 1.0;

  #pragma SLOT postf_linear



}