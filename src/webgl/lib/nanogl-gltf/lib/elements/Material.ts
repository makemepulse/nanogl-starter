

import { vec3 } from 'gl-matrix';
import PbrMetallicRoughness from './PbrMetallicRoughness';
import NormalTextureInfo from './NormalTextureInfo';
import OcclusionTextureInfo from './OcclusionTextureInfo';
import TextureInfo from './TextureInfo';

import { GLContext, isWebgl2 } from 'nanogl/types';
import MaterialPass from 'nanogl-pbr/MaterialPass';
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import Input from 'nanogl-pbr/Input';
import BaseMaterial from 'nanogl-pbr/BaseMaterial';
import Primitive from './Primitive';
import Node from './Node';
import { IElement } from '../types/Elements';
import Gltf from '../Gltf';
import Flag from 'nanogl-pbr/Flag';
import { isAllZeros } from '../lib/Utils';
import UnlitPass from 'nanogl-pbr/UnlitPass';
import ShaderVersion from 'nanogl-pbr/ShaderVersion';
import { StandardMetalness, StandardPass } from 'nanogl-pbr/StandardPass';
import { MetalnessSurface } from 'nanogl-pbr/PbrSurface';





const SRC_ALPHA             = 0x0302;
const ONE_MINUS_SRC_ALPHA   = 0x0303;


export interface IPbrInputsData {
  setupPass( pass : StandardPass ):void
}


export interface IMaterial extends IElement {
  readonly gltftype: GltfTypes.MATERIAL
  createMaterialForPrimitive( gltf:Gltf, node : Node, primitive : Primitive ) : BaseMaterial
}


export type GltfMaterialPass = MaterialPass & {
  version : ShaderVersion
}


export abstract class GltfBaseMaterial<TPass extends GltfMaterialPass> implements IMaterial {

  readonly gltftype = GltfTypes.MATERIAL;
  name        : undefined | string;
  extras      : any   ;

  pbrMetallicRoughness?: PbrMetallicRoughness;
  normalTexture?: NormalTextureInfo;
  occlusionTexture?: OcclusionTextureInfo;
  emissiveTexture?: TextureInfo;
  emissiveFactor: vec3;
  alphaMode: Gltf2.MaterialAlphaMode;
  alphaCutoff: number;
  doubleSided: boolean;

  pbrInputsData : IPbrInputsData;


  
  protected _materialPass   : TPass

  get materialPass() : TPass {
    return this._materialPass;
  }


  createMaterialForPrimitive( gltf:Gltf, node : Node, primitive : Primitive ) : BaseMaterial {
    const gl = gltf.gl
    this._materialPass.version.set( isWebgl2(gl) ? '300 es' : '100' )

    const material = new BaseMaterial( gl, this._materialPass.name )
    material.addPass( this._materialPass, 'color' )

    const normal = primitive.attributes.getSemantic( 'NORMAL')
    const tangent = primitive.attributes.getSemantic( 'TANGENT')
    material.inputs.add( new Flag('hasNormals', normal !== null ))
    material.inputs.add( new Flag('hasTangents', tangent !== null ))

    
    const vcColorAttrib = primitive.attributes.getSemantic( 'COLOR_0')
    if( vcColorAttrib !== null ){
      // vertex color
      const vcInput = new Input( 'vertexColor', 3 );
      vcInput.attachAttribute( vcColorAttrib.glslname );
      material.inputs.add( vcInput );
    }

    material.addPass( gltf.depthPass, 'depth' );
    
    return material;
  }

  


  async parse(gltfLoader: GltfLoader, data: Gltf2.IMaterial): Promise<any> {

    this.emissiveFactor = new Float32Array(data.emissiveFactor || [0, 0, 0]) as vec3;

    this.alphaMode = data.alphaMode || Gltf2.MaterialAlphaMode.OPAQUE;
    this.alphaCutoff = data.alphaCutoff ?? 0.5;
    this.doubleSided = data.doubleSided ?? false;

    await this.parsePbrInputsData( gltfLoader, data );

    if (data.normalTexture !== undefined) {
      this.normalTexture = await gltfLoader._loadElement(data.normalTexture);
    }

    if (data.occlusionTexture !== undefined) {
      this.occlusionTexture = await gltfLoader._loadElement(data.occlusionTexture);
    }

    if (data.emissiveTexture !== undefined) {
      this.emissiveTexture = await gltfLoader._loadElement(data.emissiveTexture);
    }

    this.name = data.name;
    this.setupMaterials();

  }

  async parsePbrInputsData( gltfLoader: GltfLoader, data: Gltf2.IMaterial ) : Promise<any>{
    if (data.pbrMetallicRoughness !== undefined) {
      this.pbrInputsData = this.pbrMetallicRoughness = new PbrMetallicRoughness()
      await this.pbrMetallicRoughness.parse(gltfLoader, data.pbrMetallicRoughness)
    }
  }

  configurePbrSurface( pass : StandardPass ){
    if (this.pbrInputsData !== undefined) {
      this.pbrInputsData.setupPass( pass );
    } else {
      pass.setSurface( new MetalnessSurface() )
    }
  }

  configureAlpha( pass : StandardPass|UnlitPass ){
    if( this.alphaMode === Gltf2.MaterialAlphaMode.BLEND ){

      pass.glconfig.depthMask( false );
      pass.glconfig.enableBlend()
      pass.glconfig.blendFunc( SRC_ALPHA, ONE_MINUS_SRC_ALPHA );
      pass.mask = Gltf.getRenderConfig().blendedMask;
    } else {
      pass.mask = Gltf.getRenderConfig().opaqueMask;
    }

    pass.alphaMode.set( this.alphaMode );
    if( this.alphaMode === Gltf2.MaterialAlphaMode.MASK ){
      pass.alphaCutoff.attachUniform('uAlphaCutoff').set( this.alphaCutoff );
    }
  }

  abstract setupMaterials(): void;


}

export default class Material extends GltfBaseMaterial<StandardPass> {
//
  setupMaterials(): void {
    const pass = new StandardPass(this.name);

    pass.glconfig.enableDepthTest();
    pass.glconfig.enableCullface(!this.doubleSided);
    pass.doubleSided.set( this.doubleSided );

    this.configureAlpha( pass );
    this.configurePbrSurface( pass );


    if ( this.emissiveTexture ) {
      const sampler = this.emissiveTexture.createSampler('emissive');
      pass.emissive.attach( sampler );
    }
    
    if( !isAllZeros( this.emissiveFactor) ){
      pass.emissiveFactor.attachUniform('uEmissFactor').set(...this.emissiveFactor);
    }
    
    
    const nrm = this.normalTexture;
    if ( nrm ) {
      const sampler = nrm.createSampler( 'nrmmap' );
      pass.normal.attach( sampler )
      
      if (nrm.scale !== 1) {
        pass.normalScale.attachUniform('uNormalScale').set(nrm.scale)
      }
    }
    

    const occlu = this.occlusionTexture;
    if (occlu) {

      const sampler = occlu.createSampler( 'occlu' )
      pass.occlusion.attach(sampler);

      if (occlu.strength !== 1) {
        pass.occlusionStrength.attachUniform('uOccluStrength').set(occlu.strength)
      }
    }

    this._materialPass = pass;

  }

}


