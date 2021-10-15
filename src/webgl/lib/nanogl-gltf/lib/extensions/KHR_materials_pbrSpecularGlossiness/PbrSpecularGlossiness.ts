


import { vec4, vec3 } from 'gl-matrix';

import { Uniform         } from 'nanogl-pbr/Input'        ;
import { StandardPass    } from 'nanogl-pbr/StandardPass' ;
import { SpecularSurface } from 'nanogl-pbr/PbrSurface'   ;

import   TextureInfo   from '../../elements/TextureInfo' ;
import   GltfLoader    from '../../io/GltfLoader'        ;
import   Gltf2         from '../../types/Gltf2'          ;
import { isAllOnes   } from '../../lib/Utils'            ;
import   GltfTypes     from '../../types/GltfTypes'      ;


export interface IMaterialPbrSpecularGlossiness {
  /**
   * The reflected diffuse factor of the material.
   */
  diffuseFactor?: number[]
  /**
   * The diffuse texture.
   */
  diffuseTexture?: Gltf2.ITextureInfo
  /**
   * The specular RGB color of the material.
   */
  specularFactor?: number[]
  /**
   * The glossiness or smoothness of the material.
   */
  glossinessFactor?: number
  /**
   * The specular-glossiness texture.
   */
  specularGlossinessTexture?: Gltf2.ITextureInfo
}


export default class PbrSpecularGlossiness {


  diffuseFactor              : vec4       ;
  specularFactor             : vec3       ;
  glossinessFactor           : number     ;
  diffuseTexture           ? : TextureInfo;
  specularGlossinessTexture? : TextureInfo;
  


  async parse( gltfLoader:GltfLoader, data: IMaterialPbrSpecularGlossiness ) : Promise<any>{

    this.diffuseFactor = <vec4> new Float32Array(data.diffuseFactor || [1,1,1,1]);
    this.specularFactor = <vec3> new Float32Array(data.specularFactor || [1,1,1]);
    this.glossinessFactor  = data.glossinessFactor ?? 1

    if( data.diffuseTexture !== undefined ){
      gltfLoader.prepareGltfProperty( data.diffuseTexture, GltfTypes.TEXTURE_INFO, -1, null );
      this.diffuseTexture = await gltfLoader._loadElement( data.diffuseTexture );
    }
    
    if( data.specularGlossinessTexture !== undefined ){
      gltfLoader.prepareGltfProperty( data.specularGlossinessTexture, GltfTypes.TEXTURE_INFO, -1, null );
      this.specularGlossinessTexture = await gltfLoader._loadElement( data.specularGlossinessTexture );
    }

  }

  setupPass( pass : StandardPass ){

    const surface = new SpecularSurface() 
    pass.setSurface( surface )

    if (this.diffuseTexture) {
      const diffuseSampler = this.diffuseTexture.createSampler('diffuse')
      surface.baseColor.attach( diffuseSampler, 'rgb')
      pass.alpha      .attach( diffuseSampler, 'a')
    }

    if( ! isAllOnes( this.diffuseFactor ) ){
      const cFactor = new Uniform( 'uBasecolorFactor', 4 );
      cFactor.set( ...this.diffuseFactor )
      surface.baseColorFactor.attach(cFactor, 'rgb' )
      pass.alphaFactor      .attach(cFactor, 'a')
    }


    if (this.specularGlossinessTexture) {
      const mrSampler = this.specularGlossinessTexture.createSampler('specgloss')
      surface.specular  .attach(mrSampler, 'rgb')
      surface.glossiness.attach(mrSampler, 'a')
    }


    if (! isAllOnes( this.specularFactor )) {
      surface.specularFactor.attachUniform('uMetalnessFactor').set(...this.specularFactor)
    }
    
    if (this.glossinessFactor !== 1) {
      surface.glossinessFactor.attachUniform('uRoughnessFactor').set(this.glossinessFactor)
    }
    
  }

}

