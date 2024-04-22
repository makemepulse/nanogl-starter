
import { createDevCamera } from '@game/renderer/dev/cameras';
import gui from '@game/renderer/dev/gui';
import GameRenderer from "@game/renderer/GameRenderer";
import { vec3 } from "gl-matrix";
import Camera from "nanogl-camera";
import OrthographicLens from 'nanogl-camera/ortho-lens';
import CameraManager from './CameraManager';


export type CameraName = 'main' | 'dev' | string


export default class Cameras {

  private _managers = new Map<CameraName,CameraManager>()

  private _current!: CameraManager;
  
  constructor( readonly renderer:GameRenderer ){
    const mainManager   = new CameraManager(Cameras.makeDefaultCamera())
    this.registerCamera( mainManager, 'main' )
    
    
    /// #if DEBUG
    /** enable debug cameras */
    const devCamera = createDevCamera(renderer)
    this.registerCamera( devCamera, 'dev' )

    if( localStorage.getItem('devcam_state') ){
      const state = JSON.parse( localStorage.getItem('devcam_state')! )
      devCamera.camera.setMatrix( state.matrix )
      devCamera.camera.lens.fov = state.fov
      devCamera.camera.lens.near = state.near
      devCamera.camera.lens.far = state.far
    }

    // this.registerCamera( createBlenderCamera(renderer), '' )
    this._gui()
    // this.use( 'dev' )
    this.use( 'main' )
    
    /// #else
    this.use( 'main' )
    /// #endif

  }

  /**
   * the active camera
   */
  get camera()     : Camera{
    return this._current.camera
  }

  get mainCamera():Camera<OrthographicLens> {
    return this._managers.get( 'main' )!.camera as Camera<OrthographicLens>
  }

  get mainManager():CameraManager<OrthographicLens> {
    return this._managers.get( 'main' ) as CameraManager<OrthographicLens>
  }

  get current(): CameraManager {
    return this._current
  }

  use( name:CameraName ):void {
    this._current?.stop()
    console.assert( this._managers.has(name), `camera manager ${name} doesn't exist` )
    this._current = this._managers.get( name )!
    this._current?.start()
    
    /// #if DEBUG
    // this._updateCurrentGui()
    /// #endif
  }

  
  registerCamera( manager : CameraManager, name:CameraName ):void {
    console.assert( !this._managers.has(name), `camera manager ${name} already registered` )
    this._managers.set( name, manager )
    // this.renderer.scene.root.add( manager.camera )
  }


  preRender():void{
    this.current.preRender()
    this.camera.updateWorldMatrix()
  }


  static makeDefaultCamera():Camera<OrthographicLens> {
    // const camera = Camera.makePerspectiveCamera()
    const camera = new Camera( new OrthographicLens() );
    camera.lens.setBound( -10, 10, -10, 10 )  
    camera.z = -1
    camera.lens.near = -0.01
    camera.lens.far = 1.01
    camera.lookAt( vec3.create() )
    camera.rotateZ( Math.PI )
    return camera
  }






  /// #if DEBUG
  private _gui(){
    const g = gui.folder( 'Cameras' )
    const names = Array.from(this._managers.keys())
    g.radios<CameraName>( 'camera', names ).onChange( name=>this.use(name) )
    g.btn( 'log matrix', ()=>console.log( Array.from(this.camera._matrix )))
    g.btn( 'log position', ()=>console.log( Array.from(this.camera._wposition )))
    g.btn( 'place devcam to main', ()=>{
      this._managers.get( 'dev' )!.camera.setMatrix( this.mainCamera._matrix )
    }).setHint('Move dev camera to main camera position')
    
  }



  /// #endif

}