
import gui         from '@webgl/dev/gui'

import { DEG2RAD } from "@webgl/math";
import Renderer from "@webgl/Renderer";
import { mat4 } from "gl-matrix";
import Camera from "nanogl-camera";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import MaxController from './MaxController';

import CameraManager from './CameraManager';



export default class Cameras {

  private _current       : CameraManager<PerspectiveLens>

  mainManager    : CameraManager<PerspectiveLens>
  devManager     : CameraManager<PerspectiveLens>

  maxcam    : MaxController
  
  get mainCamera():Camera<PerspectiveLens> {
    return this.mainManager.camera
  }
  
  get devCamera():Camera<PerspectiveLens> {
    return this.devManager.camera
  }

  useDevCam():void {
    this._current = this.devManager
  }

  useMainCam():void {
    this._current = this.mainManager
  }


  constructor( readonly renderer:Renderer ){


    // CAMERA
    // ======
    this.mainManager   = new CameraManager(this.makeDefaultCamera())
    this.devManager    = new CameraManager(this.makeDefaultCamera())

    // CONTROLERS
    // ======
    this.maxcam    = new MaxController(renderer.ilayer)
    this.devManager.setControler( this.maxcam )

    // GRAPH
    // ======
    renderer.root.add( this.mainCamera )
    renderer.root.add( this.devCamera  )

    
    const g = gui.folder( 'cameras' )
    g.btn('mainCam', ()=>{this.useDevCam()})
    g.btn('devCam', ()=>{this.useMainCam()})
    g.btn('logDebugCam',  ()=>{ console.log( this.devCamera._matrix ) })

    g.add(this.mainCamera.lens, 'near', .1, 50)
    g.add(this.mainCamera.lens, 'far', 10, 200)

  }

  /**
   * the rendered camera
   */
  get camera()     : Camera<PerspectiveLens>{
    return this._current.camera
  }

  get controler(): CameraManager {
    return this._current
  }


  preRender():void{
    this.controler.preRender()
  }


  makeDefaultCamera():Camera<PerspectiveLens> {
    // const camera = Camera.makePerspectiveCamera()
    const camera = new Camera( new PerspectiveLens() );
    camera.lens.setAutoFov(35.0 * DEG2RAD) //80
    camera.lens.near = .01
    camera.lens.far = 50

    camera.setMatrix(new Float32Array(
      [0.7726250290870667, -1.4619167210128126e-8, -0.6348624229431152, 0, -0.030748367309570312, 0.9988264441490173, -0.037420663982629776, 0, 0.6341174244880676, 0.048433128744363785, 0.7717183828353882, 0, 5.253443717956543, 1.3910399675369263, 6.792383193969727, 1]
    ) as mat4)

    return camera
  }

}