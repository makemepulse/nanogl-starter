


import { vec4 } from 'gl-matrix';
import TextureInfo from './TextureInfo';
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import { isAllOnes } from '../lib/Utils';
import { Uniform } from 'nanogl-pbr/Input';
import { StandardPass } from 'nanogl-pbr/StandardPass';
import { MetalnessSurface } from 'nanogl-pbr/PbrSurface';


export default class PbrMetallicRoughness {


  baseColorFactor          : vec4       ;
  metallicFactor           : number     ;
  roughnessFactor          : number     ;
  baseColorTexture?        : TextureInfo;
  metallicRoughnessTexture?: TextureInfo;
  


  async parse( gltfLoader:GltfLoader, data: Gltf2.IMaterialPbrMetallicRoughness ) : Promise<any>{

    this.baseColorFactor = <vec4> new Float32Array(data.baseColorFactor || [1,1,1,1]);
    
    this.metallicFactor  = data.metallicFactor ?? 1
    this.roughnessFactor = data.roughnessFactor ?? 1

    if( data.baseColorTexture !== undefined ){
      this.baseColorTexture = await gltfLoader._loadElement( data.baseColorTexture );
    }
    
    if( data.metallicRoughnessTexture !== undefined ){
      this.metallicRoughnessTexture = await gltfLoader._loadElement( data.metallicRoughnessTexture );
    }

  }

  setupPass( pass : StandardPass ){

    const surface = new MetalnessSurface() 
    pass.setSurface( surface )

    if (this.baseColorTexture) {
      const baseColorSampler = this.baseColorTexture.createSampler( 'basecolor' )
      surface.baseColor.attach(baseColorSampler, 'rgb')
      pass.alpha    .attach(baseColorSampler, 'a')
    }

    if( ! isAllOnes( this.baseColorFactor ) ){
      const cFactor = new Uniform( 'uBasecolorFactor', 4 );
      cFactor.set( ...this.baseColorFactor )
      surface.baseColorFactor.attach(cFactor, 'rgb' )
      pass.alphaFactor    .attach(cFactor, 'a')
    }


    if (this.metallicRoughnessTexture) {
      const mrSampler = this.metallicRoughnessTexture.createSampler( 'metalRough' )
      surface.metalness.attach(mrSampler, 'b')
      surface.roughness.attach(mrSampler, 'g')
    }


    if (this.metallicFactor !== 1) {
      surface.metalnessFactor.attachUniform('uMetalnessFactor').set(this.metallicFactor)
    }
    
    if (this.roughnessFactor !== 1) {
      surface.roughnessFactor.attachUniform('uRoughnessFactor').set(this.roughnessFactor)
    }
    
  }

}

