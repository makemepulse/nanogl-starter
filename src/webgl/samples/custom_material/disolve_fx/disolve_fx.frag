
{{= if(obj.slot === 'pv' ){ }}
// SLOT pv
// ===============================
OUT vec3 vDisolvePos;



{{= } else if(obj.slot === 'postv' ){ }}
// SLOT postv
// ===============================
vDisolvePos = vertex.worldPos.xyz * DisolveScale();



{{= } else if(obj.slot === 'pf' ){ }}
// SLOT pf
// ===============================
IN vec3 vDisolvePos;
{{ require( "./simplex.glsl" )() }}

// SLOT f
// ===============================
{{= } else if(obj.slot === 'f' ){ }}
float disolve = simplex3d_fractal( vDisolvePos );
disolve = 0.5 + 0.5*disolve;
if( disolve < DisolveThreshold() ){
  discard;
}

{{= } }}

