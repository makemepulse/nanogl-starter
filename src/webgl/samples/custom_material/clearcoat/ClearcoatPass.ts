import Input from "nanogl-pbr/Input";
import { MetalnessSurface, PbrSurface, SpecularSurface } from "nanogl-pbr/PbrSurface";
import { StandardPass } from "nanogl-pbr/StandardPass";

import vShader from "./glsl/clearcoat.vert"
import fShader from "./glsl/clearcoat.frag"


export class ClearcoatPass<TSurface extends PbrSurface = PbrSurface> extends StandardPass<TSurface>{

  clearcoatSmoothness : Input

  constructor( name?: string ){
    super(name)

    this._shaderSource = {
      uid: 'clearcoat',
      vert: vShader(),
      frag: fShader(),
    };

    this.inputs.add(this.clearcoatSmoothness = new Input('ClearcoatSmoothness', 1));
    this.clearcoatSmoothness.attachConstant(1)

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

  constructor( name = 'clearcoat-spec-pass' ){
    super( name );
    this.setSurface( new MetalnessSurface() );
  }
}
