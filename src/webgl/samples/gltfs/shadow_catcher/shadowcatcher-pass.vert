#pragma SLOT version

#pragma SLOT definitions

#pragma SLOT precision

{{ require( "nanogl-pbr/glsl/includes/glsl-compat.vert" )() }}

#pragma SLOT pv


IN vec3 aPosition;
IN vec2 aTexCoord0;

OUT mediump vec3 vWorldNormal;
OUT vec3 vWorldPosition;


// uniform mat4 uMVP;
uniform mat4 uWorldMatrix;
uniform mat4 uVP;



vec3 rotate( mat4 m, vec3 v )
{
  return m[0].xyz*v.x + m[1].xyz*v.y + m[2].xyz*v.z;
}


struct VertexData {
  highp vec3 position;
  highp vec3 worldPos;
  vec3 normal;
  mat4 worldMatrix;
};


void InitVertexData( out VertexData vertex ){
  vertex.position = aPosition;
  vertex.normal = vec3(0.0, 1.0, 0.0);
  vertex.worldMatrix = uWorldMatrix;
}


void main( void ){

  #pragma SLOT v

  VertexData vertex;
  InitVertexData( vertex );

  #pragma SLOT vertex_warp

  vec4 worldPos = vertex.worldMatrix * vec4( vertex.position, 1.0 );
  vertex.worldPos.xyz = worldPos.xyz / worldPos.w;

  #pragma SLOT vertex_warp_world

  gl_Position     = vec4( aTexCoord0*2.0-1.0, 0.5, 1.0 );
  // gl_Position     = uVP * vec4( vertex.worldPos, 1.0 );
  vWorldPosition  = vertex.worldPos;
  
  vWorldNormal    = normalize( rotate( vertex.worldMatrix, vertex.normal ) );

  #pragma SLOT postv
}