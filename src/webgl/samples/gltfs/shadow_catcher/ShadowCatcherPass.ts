import ShaderPrecision from "nanogl-pbr/ShaderPrecision";
import ShaderVersion from "nanogl-pbr/ShaderVersion";

import vShader            from './shadowcatcher-pass.vert'
import fShader            from './shadowcatcher-pass.frag'
import MaterialPass from "nanogl-pbr/MaterialPass";
import Program from "nanogl/program";
import Camera from "nanogl-camera";
import Node from "nanogl-node";
import { mat4 } from "gl-matrix";
import LightSetup from "nanogl-pbr/lighting/LightSetup";
import Input from "nanogl-pbr/Input";
import Enum from "nanogl-pbr/Enum";
import { ShadowFiltering } from "nanogl-pbr/ShadowFilteringEnum";
import DirectionalLight from "nanogl-pbr/lighting/DirectionalLight";

const MAT_ID = 'lmpass';

const M4 = mat4.create();

/**
 * render hdr shadowcatcher for a given light
 */
export default class ShadowcatcherPass extends MaterialPass {

  version     : ShaderVersion
  precision   : ShaderPrecision
  light   : DirectionalLight
  normal      : Input

  sampleIndex = 0
  shadowFilter: Enum<readonly ["PCFNONE", "PCF4x1", "PCF4x4", "PCF2x2"]>;

  maxSamples = 100

  constructor( private lightSetup: LightSetup ){
    super( {
      uid  : MAT_ID,
      vert : vShader(),
      frag : fShader(),
    } );


    const inputs = this.inputs;

    this.shadowFilter = new Enum('shadowFilter', ShadowFiltering );

    inputs.add( this.version               = new ShaderVersion( '100' ) );
    inputs.add( this.precision             = new ShaderPrecision( 'highp' ) );
    inputs.add( this.shadowFilter );
    inputs.add( this.lightSetup.depthFormat );
  }



  setLight( l:DirectionalLight ):void {
    this.light = l;
  }

  prepare( prg:Program, node : Node, camera : Camera ){
    
    if( prg.uMVP ){
      camera.modelViewProjectionMatrix( M4, node._wmatrix );
      prg.uMVP( M4 );
    }
    
    if( prg.uWorldMatrix )
      prg.uWorldMatrix( node._wmatrix );
    
    if( prg.uVP )
      prg.uVP( camera._viewProj );
    
    if( prg.uCameraPosition )
      prg.uCameraPosition( camera._wposition );

    const light = this.light 
    // prg.uSampleIndex     ( this.sampleIndex );
    prg.uSampleWeight     ( 1/this.maxSamples );

    if( prg.uShadowKernelRotation ){
      prg.uShadowKernelRotation (0.0, 0.0)
    }
    prg.uShadowMatrix         (light.getShadowProjection(this.lightSetup.bounds))
    prg.uShadowTexelBiasVector(light.getTexelBiasVector())

    const s = light.shadowmapSize
    prg.uShadowMapSize        (s, 1/s)

    const tex = light.getShadowmap();
    prg.tShadowMap(tex)

  }

}