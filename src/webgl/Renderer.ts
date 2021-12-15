import { vec4 } from "gl-matrix";
import Camera from "nanogl-camera";
import { GLContext } from "nanogl/types";
import Cameras from "./cameras/Cameras";
import { MainRenderContext } from "./core/Renderer";
import RenderMask from "./core/RenderMask";
import Viewport from "./core/Viewport";
import DebugDraw from "./dev/debugDraw/DebugDraw";
import { ColorGui } from "./dev/gui/decorators";
import GLView from "./GLView";
import Scene from "./scene";
import Tests from "./tests";


export default class Renderer {


  ilayer    : HTMLElement
  cameras   : Cameras

  @ColorGui
  clearColor = vec4.fromValues(.95, .95, .95, 1)
  
  tests: Tests;
  scene: Scene;

  /**
   * main backbuffer viewport
   */
  readonly viewport = new Viewport()
  
  
  readonly context: MainRenderContext;

  

  

  constructor( readonly glview : GLView ){

    glview.onRender.on( this._onViewRender )

    this.ilayer = glview.canvas

    DebugDraw.init( glview.gl )

    
    this.tests = new Tests( this.gl )
    this.scene = new Scene( this )
    this.cameras = new Cameras(this)
    this.context = new MainRenderContext( this.gl, this.viewport )

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

    this.context.withCamera( this.camera )
    
    this.viewport.setSize(this.glview.width, this.glview.height)
    this.viewport.setupGl(gl)

    const c = this.clearColor
    gl.clearColor(c[0], c[1], c[2], c[3])
    gl.clear( this.gl.COLOR_BUFFER_BIT );

    this.renderScene()
    DebugDraw.render(this.context)
  }

  private renderScene( ){


    this.cameras.preRender()
    this.scene.preRender()

    this.scene.root.updateWorldMatrix()

    this.camera.updateViewProjectionMatrix(this.width, this.height);

    this.scene.rttPass()
    this.scene.render(this.context.withMask(RenderMask.OPAQUE))
    this.scene.render(this.context.withMask(RenderMask.BLENDED))
    this.tests.render()
    
  }





}