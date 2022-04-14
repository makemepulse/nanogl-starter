
{{= if(obj.slot === 'pv' ){ }}
// SLOT pv (vertex shader declarations)
// ===============================
// declare a vec3 varying used for simplex noise input coord
OUT vec3 vDisolvePos;



{{= } else if(obj.slot === 'postv' ){ }}
// SLOT postv (end of main vertex function)
// ===============================
// set the above varying
vDisolvePos = vertex.worldPos.xyz * DisolveScale();



{{= } else if(obj.slot === 'pf' ){ }}
// SLOT pf (fragment shader declarations)
// ===============================
// declare a vec3 varying used for simplex noise input coord
// and inject simplex noise definitions
IN vec3 vDisolvePos;
{{ require( "./simplex.glsl" )() }}



{{= } else if(obj.slot === 'f' ){ }}
// SLOT f (start of main fragment function)
// ===============================
// noise sampling and fragment discading
float disolve = simplex3d_fractal( vDisolvePos );
disolve = 0.5 + 0.5*disolve;
if( disolve < DisolveThreshold() ){
  discard;
}

{{= } }}

