import Input from "nanogl-pbr/Input";
import { MetalnessSurface, PbrSurface, SpecularSurface } from "nanogl-pbr/PbrSurface";
import { StandardPass } from "nanogl-pbr/StandardPass";

import vShader from "nanogl-pbr/glsl/standard.vert"
import fShader from "./clearcoat.frag"
import LiveShader from "@webgl/core/LiveShader";

/**
 * create Hot-reloadable shaders
 */
const FragCode = LiveShader(fShader)


/**
 * This pass inherit the StandardPass from nanogl-pbr
 * the shader only alter the lighting funcitons to add clearcoat to the brdf calculations
 */
export class ClearcoatPass<TSurface extends PbrSurface = PbrSurface> extends StandardPass<TSurface>{

  /**
   * add new parameter for clearcoat smoothness
   */
  clearcoatSmoothness : Input

  constructor( name?: string ){
    super(name)

    this._updateCode()

    
    // add new parameter for clearcoat smoothness
    // adn set it by default to constant 1
    this.inputs.add(this.clearcoatSmoothness = new Input('ClearcoatSmoothness', 1));
    this.clearcoatSmoothness.attachConstant(1)
    
    // update pass shader code when glsl update
    // could add vertex shader also, but here we use one from nanogl-pbr
    // noop in non DEBUG mode
    FragCode.onHmr(()=>this._updateCode())
    
  }
  
  /**
   * in release mode, this is called once, in the ctor
   * in DEBUG, it can be called each time the fragment shader is edited
   * in this case, the pass need to be invalidated to force recompilation
   */
  private _updateCode( ){
    this._shaderSource.vert = vShader()
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
