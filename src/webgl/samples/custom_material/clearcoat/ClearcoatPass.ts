import Input from "nanogl-pbr/Input";
import { MetalnessSurface, PbrSurface, SpecularSurface } from "nanogl-pbr/PbrSurface";
import { StandardPass } from "nanogl-pbr/StandardPass";

import vShader from "./clearcoat.vert"
import fShader from "./clearcoat.frag"
import LiveShader from "@webgl/core/LiveShader";

/**
 * create Hot-reloadable shaders
 */
const VertCode = LiveShader(vShader)
const FragCode = LiveShader(fShader)


/**
 * This pass inherit the StandardPass from nanogl-pbr
 * the shader only alter the lighting funcitons to add clearcoat to the brdf calculations
 */
export class ClearcoatPass<TSurface extends PbrSurface = PbrSurface> extends StandardPass<TSurface>{

  clearcoatSmoothness : Input

  constructor( name?: string ){
    super(name)

    this._updateCode()

    this.inputs.add(this.clearcoatSmoothness = new Input('ClearcoatSmoothness', 1));
    this.clearcoatSmoothness.attachConstant(1)
    
    // update pass shader code when glsl update
    // noop in non DEBUG mode
    VertCode.onHmr(()=>this._updateCode())
    FragCode.onHmr(()=>this._updateCode())
    
  }
  
  _updateCode( ){
    this._shaderSource.vert = VertCode()
    this._shaderSource.frag = FragCode()
    /// #if DEBUG
    this.inputs.invalidateCode()
    this._shaderSource.uid = Math.random().toString()
    /// #endif
  }

}


export class ClearcoatSpecular extends ClearcoatPass<SpecularSurface> {

  readonly surface!: SpecularSurface

  constructor( name = 'clearcoat-spec-pass' ){
    super( name );
    this.setSurface( new SpecularSurface() );
  }
}

export class ClearcoatMetalness extends ClearcoatPass<MetalnessSurface> {
  
  readonly surface!: MetalnessSurface

  constructor( name = 'clearcoat-metal-pass' ){
    super( name );
    this.setSurface( new MetalnessSurface() );
  }
}
