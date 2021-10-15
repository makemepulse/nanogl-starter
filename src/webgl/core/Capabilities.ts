import { GLContext } from "nanogl/types";



function _hasPrecision( gl:GLContext, p : GLenum ): boolean {
  const hv = gl.getShaderPrecisionFormat( gl.VERTEX_SHADER,   p );
  const hf = gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, p );
  return  hf.precision > 0 && hv.precision > 0;

}


const Capabilities = {

  hasHighpPrecision( gl:GLContext ): boolean {
    return _hasPrecision( gl, gl.HIGH_FLOAT )
  },
  
  hasMediumpPrecision( gl:GLContext ): boolean {
    return _hasPrecision( gl, gl.MEDIUM_FLOAT )
  },
  
}


export default Capabilities