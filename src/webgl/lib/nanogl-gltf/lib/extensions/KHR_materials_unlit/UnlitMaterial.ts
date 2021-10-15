import Material from "../../elements/Material"
import UnlitPass from 'nanogl-pbr/UnlitPass'
import { isAllOnes } from "../../lib/Utils";
import PbrMetallicRoughness from "../../elements/PbrMetallicRoughness";
import { Uniform } from "nanogl-pbr/Input";

export default class UnlitMaterial extends Material {

  setupMaterials(): void {
    const pass = new UnlitPass(this.name);

    pass.glconfig.enableDepthTest();
    pass.glconfig.enableCullface(!this.doubleSided);
    pass.doubleSided.set( this.doubleSided );


    this.configureAlpha(pass);
    
    if (this.pbrInputsData !== undefined) {
      const metalicRoughness : PbrMetallicRoughness = this.pbrInputsData as PbrMetallicRoughness;

      if( metalicRoughness.baseColorTexture )
      if (metalicRoughness.baseColorTexture) {
        const baseColorSampler = metalicRoughness.baseColorTexture.createSampler('basecolor')
        pass.baseColor.attach(baseColorSampler, 'rgb')
        pass.alpha    .attach(baseColorSampler, 'a')
      }

      if( ! isAllOnes( metalicRoughness.baseColorFactor ) ){
        const cFactor = new Uniform( 'uBasecolorFactor', 4 );
        cFactor.set( ...metalicRoughness.baseColorFactor )
        pass.baseColorFactor.attach(cFactor, 'rgb' )
        pass.alphaFactor    .attach(cFactor, 'a')
      }

    }

    this._materialPass = pass;

  }
}