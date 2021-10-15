precision {{@bestPrecision}} float;

varying vec2 vTexCoord0;
uniform sampler2D tTex;

void main(void){
  gl_FragColor = texture2D( tTex, vTexCoord0 );
}
