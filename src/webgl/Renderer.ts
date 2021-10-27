import { vec4 } from "gl-matrix";
import Camera from "nanogl-camera";
import GLState from "nanogl-state";
import { GLContext } from "nanogl/types";
import Cameras from "./cameras/Cameras";
import IRenderer from "./core/IRenderer";
import RenderMask from "./core/RenderMask";
import RenderPass from "./core/RenderPass";
import DebugDraw from "./dev/debugDraw/DebugDraw";
import { ColorGui } from "./dev/gui/decorators";
import GLView from "./GLView";
import Scene from "./scene";
import Tests from "./tests";


export default class Renderer implements IRenderer {


  ilayer    : HTMLElement
  cameras   : Cameras
  glstate   : GLState

  @ColorGui
  clearColor = vec4.fromValues(.95, .95, .95, 1)
  
  tests: Tests;
  scene: Scene;

  

  constructor( readonly glview : GLView ){

    glview.onRender.on( this._onViewRender )

    this.glstate = new GLState( this.gl )
    this.ilayer = glview.canvas

    DebugDraw.init( this )

    
    this.tests = new Tests( this )
    this.scene = new Scene( this )
    this.cameras = new Cameras(this)

  }


  get gl(): GLContext{
    return this.glview.gl
  }

  get camera(): Camera {
    return this.cameras.camera
  }

  get width(): number {
    return this.glview.width
  }

  get height(): number {
    return this.glview.height
  }


  load(): Promise<void>{
    return this.scene.load()
  }


  private _onViewRender = (dt:number)=>{
    dt;

    const gl = this.gl
    const c = this.clearColor
    gl.clearColor(c[0], c[1], c[2], c[3])
    gl.clear( this.gl.COLOR_BUFFER_BIT );
    gl.viewport( 0, 0, this.glview.width, this.glview.height )

    this.renderScene()
    DebugDraw.render()
  }

  private renderScene( ){


    this.cameras.preRender()
    this.scene.preRender()

    this.scene.root.updateWorldMatrix()


    this.camera.updateViewProjectionMatrix(this.width, this.height);

    this.scene.render({renderer:this, camera:this.camera, mask: RenderMask.BLENDED, pass:RenderPass.COLOR})
    this.scene.render({renderer:this, camera:this.camera, mask: RenderMask.OPAQUE, pass:RenderPass.COLOR})
    this.tests.render()
    
  }





}