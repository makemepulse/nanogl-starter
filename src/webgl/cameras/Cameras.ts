
import { createDevCamera } from '@webgl/dev/cameras';
import gui         from '@webgl/dev/gui'
import { Control } from '@webgl/dev/gui/api';

import { DEG2RAD } from "@webgl/math";
import Renderer from "@webgl/Renderer";
import { mat4 } from "gl-matrix";
import Camera from "nanogl-camera";
import PerspectiveLens from "nanogl-camera/perspective-lens";

import CameraManager from './CameraManager';


export type CameraName = 'main' | 'dev' | string


export default class Cameras {

  private _managers = new Map<CameraName,CameraManager<PerspectiveLens>>()

  private _current: CameraManager<PerspectiveLens>;
  
  constructor( readonly renderer:Renderer ){
    const mainManager   = new CameraManager(Cameras.makeDefaultCamera())
    this.registerCamera( mainManager, 'main' )
    
    
    /// #if DEBUG
    /** enable debug cameras */
    this.registerCamera( createDevCamera(renderer), 'dev' )
    // this.registerCamera( createBlenderCamera(renderer), '' )
    this._gui()
    this.use( 'dev' )
    
    /// #else
    this.use( 'main' )
    /// #endif

  }

  /**
   * the active camera
   */
  get camera()     : Camera<PerspectiveLens>{
    return this._current.camera
  }

  get mainCamera():Camera<PerspectiveLens> {
    return this._managers.get( 'main' ).camera
  }

  get current(): CameraManager {
    return this._current
  }

  use( name:CameraName ):void {
    this._current?.stop()
    console.assert( this._managers.has(name), `camera manager ${name} doesn't exist` )
    this._current = this._managers.get( name )
    this._current?.start()
    
    /// #if DEBUG
    this._updateCurrentGui()
    /// #endif
  }

  
  registerCamera( manager : CameraManager<PerspectiveLens>, name:CameraName ):void {
    console.assert( !this._managers.has(name), `camera manager ${name} already registered` )
    this._managers.set( name, manager )
    // this.renderer.scene.root.add( manager.camera )
  }


  preRender():void{
    this.current.preRender()
    this.camera.updateWorldMatrix()
  }


  static makeDefaultCamera():Camera<PerspectiveLens> {
    // const camera = Camera.makePerspectiveCamera()
    const camera = new Camera( new PerspectiveLens() );
    camera.lens.setAutoFov(35.0 * DEG2RAD) //80
    camera.lens.near = .01
    camera.lens.far = 50

    camera.setMatrix(new Float32Array(
      [0.7726250290870667, -1.4619167210128126e-8, -0.6348624229431152, 0, -0.03074836730957, 0.9988264441490173, -0.037420663982629776, 0, 0.6341174244880676, 0.048433128744363785, 0.7717183828353882, 0, 5.253443717956543, 1.3910399675369263, 6.792383193969727, 1]
    ) as mat4)

    return camera
  }






  /// #if DEBUG
  private _gui(){
    const g = gui.folder( 'Cameras' )
    const names = Array.from(this._managers.keys())
    g.radios<CameraName>( 'camera', names).onChange( name=>this.use(name) )
    g.btn( 'log matrix', ()=>console.log( Array.from(this.camera._matrix )))
    g.btn( 'log position', ()=>console.log( Array.from(this.camera._wposition )))
    g.btn( 'place devcam to main', ()=>{
      this._managers.get( 'dev' ).camera.setMatrix( this.mainCamera._matrix )
    })
  }

  private _cguiCtrls:Control<unknown>[] = []

  private _updateCurrentGui(){
    const g = gui.folder( 'Cameras' )
    this._cguiCtrls.forEach( c=>c.remove())
    this._cguiCtrls.length = 0
    this._cguiCtrls.push( g.range(this.camera.lens, 'near', .1, 50) )
    this._cguiCtrls.push( g.range(this.camera.lens, 'far', 10, 200) )
  }
  /// #endif

}