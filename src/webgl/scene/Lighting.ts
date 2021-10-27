import LightSetup from "nanogl-pbr/lighting/LightSetup";
import IblLight from "./IblLight";
import { GLContext } from "nanogl/types";
import Enum from "nanogl-pbr/Enum";
import { GammaModes } from "nanogl-pbr/GammaModeEnum";
import Input, { Uniform } from "nanogl-pbr/Input";
import { StandardPass } from "nanogl-pbr/StandardPass";
import addDevIbls from "@webgl/dev/addDevIbls";
import gui from "@webgl/dev/gui";


const EXPO = 1.0
const GAMMA = 2.2

export default class Lighting {
  
  lightSetup: LightSetup;
  ibl: IblLight


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



  constructor( gl: GLContext ){

    this.ibl = new IblLight( gl )
    this.lightSetup = new LightSetup()
    this.lightSetup.add( this.ibl )


    this.gammaMode  = new Enum( 'gammaMode', GammaModes);
    this.gammaInput      = new Input( 'gamma',       1, Input.ALL );
    this.exposureInput   = new Input( 'exposure',    1, Input.ALL );
  
    this.gammaInput   .attachConstant( 1/this.gamma )
    this.exposureInput   .attachConstant( this.exposure )
    this.gammaMode.set( 'GAMMA_STD' )

    
    
    const f = gui.folder('lighting')
    f.add(this, 'exposure', 0, 3)
    f.add(this, 'gamma', .8, 4)
    f.add(this.ibl, 'ambientExposure', 0, 3).setLabel('ambient')

    addDevIbls( this )
    
  }

  setupStandardPass( standardPass : StandardPass ):void{
    standardPass.setLightSetup( this.lightSetup )
    
    standardPass.iGamma   .proxy( this.gammaInput )
    standardPass.iExposure.proxy( this.exposureInput )
    standardPass.gammaMode.proxy( this.gammaMode )
  }


  load(): Promise<void> {
    return this.ibl.load(
      require( "@/assets/webgl/ibl/Helipad/env.png"),
      require( "@/assets/webgl/ibl/Helipad/sh.bin")
    )
  }


}