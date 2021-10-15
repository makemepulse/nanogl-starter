import Time from "@webgl/Time";
import Camera from "nanogl-camera";
import { ICameraLens } from "nanogl-camera/ICameraLens";
import { ICameraController } from "./ICameraController";


export default class CameraManager<T extends ICameraLens = ICameraLens> {

  private _controler: ICameraController

  constructor( readonly camera: Camera<T> ){

  }


  setControler( ctrl:ICameraController ):void {
    this._controler?.stop()
    this._controler = ctrl;
    ctrl?.start( this.camera );
  }


  preRender():void {
    this._controler?.update( Time.dt );
  }

}