import MaterialPass from "nanogl-pbr/MaterialPass";


import vShader from "nanogl-pbr/glsl/standard.vert"
import fShader from './matcap.frag';
import Flag from "nanogl-pbr/Flag";
import Input from "nanogl-pbr/Input";
import ShaderPrecision from "nanogl-pbr/ShaderPrecision";
import ShaderVersion from "nanogl-pbr/ShaderVersion";
import { mat4 } from "gl-matrix";
import Camera from "nanogl-camera";
import Program from "nanogl/program";
import Node from "nanogl-node";
import { AlphaModeEnum, AlphaModes } from "nanogl-pbr/AlphaModeEnum";
import Enum from "nanogl-pbr/Enum";
import Texture2D from "nanogl/texture-2d";

const M4 = mat4.create();

const MAT_ID = 'matcap'

export default class MatcapPass extends MaterialPass {

  version              : ShaderVersion
  precision            : ShaderPrecision
  shaderid             : Flag

  normal               : Input
  normalScale          : Input

  alpha                : Input
  alphaCutoff          : Input
  alphaMode            : AlphaModeEnum

 

  constructor( public matcap : Texture2D = null ) {
    super({
      vert: vShader(),
      frag: fShader(),
      uid: MAT_ID
    });

    const inputs = this.inputs;


    inputs.add( this.version               = new ShaderVersion( '100' ) );
    inputs.add( this.precision             = new ShaderPrecision( 'highp' ) );
    inputs.add( this.shaderid              = new Flag ( 'id_'+MAT_ID,  true  ) );
    
    inputs.add( this.alpha                 = new Input( 'alpha'              , 1 ) );
    inputs.add( this.alphaCutoff           = new Input( 'alphaCutoff'        , 1 ) );
    inputs.add( this.alphaMode             = new Enum( 'alphaMode', AlphaModes ));

    inputs.add( this.normal                = new Input( 'normal'             , 3 ) );
    inputs.add( this.normalScale           = new Input( 'normalScale'        , 1 ) );

    this.glconfig
      .enableDepthTest()

  }

  prepare( prg:Program, node : Node, camera : Camera ){
    
    if( prg.uMVP ){
      camera.modelViewProjectionMatrix( M4, node._wmatrix );
      prg.uMVP(          M4            );
    }
    
    prg.uWorldMatrix( node._wmatrix );
    prg.uVP( camera._viewProj );
    prg.uViewMatrix( camera._view );

    if( this.matcap )
      prg.tMatcap( this.matcap );
    
    if( prg.uCameraPosition )
      prg.uCameraPosition( camera._wposition );
  

  }


}