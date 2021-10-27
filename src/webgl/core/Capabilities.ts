import { GLContext, isWebgl2 } from "nanogl/types";
import getInstancingImplementation, { InstancingImpl } from "./Instancing";
import TextureExtensions from "./TextureExtensions";



function _hasPrecision( gl:GLContext, p : GLenum ): boolean {
  const hv = gl.getShaderPrecisionFormat( gl.VERTEX_SHADER,   p );
  const hf = gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, p );
  return  hf.precision > 0 && hv.precision > 0;
}





export class CapabilitiesImpl {
  
  readonly isWebgl2:boolean
  readonly hasHighpPrecision:boolean
  readonly hasMediumpPrecision:boolean
  
  readonly textureExtensions: TextureExtensions
  readonly extAniso: EXT_texture_filter_anisotropic
  
  readonly maxAnisotropy : number
  
  readonly instancing: InstancingImpl
  readonly standardDerivatives: OES_standard_derivatives;
  
  readonly hasStandardDerivatives:boolean

  
  constructor( gl:GLContext ){
    this.isWebgl2 = isWebgl2(gl)
    
    this.hasHighpPrecision   = _hasPrecision( gl, gl.HIGH_FLOAT   )
    this.hasMediumpPrecision = _hasPrecision( gl, gl.MEDIUM_FLOAT )
    
    this.textureExtensions = new TextureExtensions( gl )

    this.extAniso =
      gl.getExtension("MOZ_EXT_texture_filter_anisotropic") ||
      gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") ||
      gl.getExtension("EXT_texture_filter_anisotropic");

    this.maxAnisotropy = (this.extAniso) ? gl.getParameter(this.extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;

    this.instancing = getInstancingImplementation( gl )

    if( !this.isWebgl2 ){
      this.standardDerivatives = gl.getExtension('OES_standard_derivatives');
      this.hasStandardDerivatives = this.standardDerivatives !== null
    } else {
      this.hasStandardDerivatives = true
    }
    
  }
  
}

const _instances = new WeakMap<GLContext, CapabilitiesImpl>()

export default function Capabilities(gl:GLContext ):CapabilitiesImpl {
  let res = _instances.get( gl )
  if( !res ){
    res = new CapabilitiesImpl(gl)
    _instances.set( gl, res )
  }
  return res
}