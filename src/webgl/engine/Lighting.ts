import LightSetup from "nanogl-pbr/lighting/LightSetup";
import { GLContext } from "nanogl/types";
import Enum from "nanogl-pbr/Enum";
import { GammaModes } from "nanogl-pbr/GammaModeEnum";
import Input, { Uniform } from "nanogl-pbr/Input";
import { StandardPass } from "nanogl-pbr/StandardPass";
import addDevIbls from "@webgl/dev/addDevIbls";
import gui from "@webgl/dev/gui";
import Material from "nanogl-pbr/Material";
import RenderPass from "@webgl/core/RenderPass";
import Node from "nanogl-node";
import LightmapRenderer, { LightmapRenderFunction } from "@webgl/core/LightmapRenderer";
import IblResource from "@webgl/resources/IblResource";
import Ibl from "nanogl-pbr/lighting/Ibl";


const EXPO = 1.0
const GAMMA = 2.2

export default class Lighting {
  
  root: Node;

  lightSetup: LightSetup;
  ibl: Ibl

  gammaMode: Enum<readonly ["GAMMA_NONE", "GAMMA_STD", "GAMMA_2_2", "GAMMA_TB"]>;
  
  gammaInput: Input
  exposureInput: Input

  expoUniform: Uniform = null
  gammaUniform: Uniform = null


  private _exposure: number = EXPO

  public get exposure(): number {
    return this._exposure
  }
  public set exposure(value: number) {
    this._exposure = value
    if( this.expoUniform === null ){
      this.expoUniform = this.exposureInput .attachUniform( 'utmExpo' )
    }
    this.expoUniform.set( this._exposure )
  }


  private _gamma: number = GAMMA

  public get gamma(): number {
    return this._gamma
  }
  public set gamma(value: number) {
    this._gamma = value
    if( this.gammaUniform === null ){
      this.gammaUniform = this.gammaInput .attachUniform( '_u_gamma' )
    }
    this.gammaUniform.set( 1/this._gamma )
  }



  constructor( readonly gl: GLContext ){
    this.root = new Node()
    this.ibl = new Ibl()
    this.ibl.enableRotation = true
    

    this.lightSetup = new LightSetup()
    this.lightSetup.add( this.ibl )
    this.lightSetup.bounds.fromMinMax([-1,-1,-1],[1,1,1])
    this.root.add( this.ibl )


    this.gammaMode  = new Enum( 'gammaMode', GammaModes);
    this.gammaInput      = new Input( 'gamma',       1, Input.ALL );
    this.exposureInput   = new Input( 'exposure',    1, Input.ALL );
  
    this.gammaInput   .attachConstant( 1/this.gamma )
    this.exposureInput   .attachConstant( this.exposure )
    this.gammaMode.set( 'GAMMA_STD' )

    this.lightSetup.stdModel.shadowFilter.set('PCF2x2')

    
    /// #if DEBUG
    const f = gui.folder('Lighting')
    f.range(this, 'exposure', 0, 3)
    f.range(this, 'gamma', .8, 4)
    f.range(this.ibl, 'intensity', 0, 5).setLabel('intensity')
    f.range(this.ibl, 'ambiantIntensity', 0, 5).setLabel('ambient')
    f.range(this.ibl, 'specularIntensity', 0, 5).setLabel('specular')
    
    const shadowFilter = this.lightSetup.stdModel.shadowFilter
    const shadowFilters = {
      shadowFiltering:shadowFilter.value()
    }
    f.addSelect( shadowFilters, 'shadowFiltering', shadowFilter.values.concat() ).onChange((v)=>shadowFilter.set(v))
    
    f.add(this.ibl, 'enableRotation').setLabel('enable ibl rotation')
    // f.add({iblRotation:0}, 'iblRotation', 0, Math.PI*2).onChange(v=>{quat.identity(this.ibl.rotation) ; this.ibl.rotateY(v); console.log(v)})
    f.addRotation( this.root, 'rotation').onChange(()=>this.root.invalidate())
    /// #endif

    addDevIbls( this )
    
  }


  renderLightmaps( renderFunction: LightmapRenderFunction ): void {
    LightmapRenderer.render( this.gl, this.lightSetup, renderFunction)
  }

  setupMaterial( material : Material ):void{
    const pass = material.getPass(RenderPass.COLOR).pass
    if( pass instanceof StandardPass ){
      this.setupStandardPass(pass)
    }
  }
  
  setupStandardPass( standardPass : StandardPass ):void{
    standardPass.setLightSetup( this.lightSetup )
    standardPass.iGamma   .proxy( this.gammaInput )
    standardPass.iExposure.proxy( this.exposureInput )
    standardPass.gammaMode.proxy( this.gammaMode )
  }


  load(): Promise<void> {
    return new IblResource({
      path: 'ibls/Harbour_2', useAssetDatabase: true, ibl: this.ibl
    }, this.gl ).load().then()
  }
 

  dispose(): void {
    gui.clearFolder('Lighting')
  }


}