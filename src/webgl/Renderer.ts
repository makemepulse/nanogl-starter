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
import { IScene } from "./scenes/IScene";
import SceneSelector from "./scenes/SceneSelector";
import Tests from "./tests";

export default class Renderer {


  ilayer    : HTMLElement
  cameras   : Cameras

  @ColorGui({folder:'Misc'})
  clearColor = vec4.fromValues(.95, .95, .95, 1)
  
  tests: Tests
  scenes: SceneSelector

  /**
   * main backbuffer viewport
   */
  readonly viewport = new Viewport()
  
  readonly context: MainRenderContext;

  

  constructor( readonly glview : GLView ){

    glview.onRender.on( this._onViewRender )

    this.ilayer = glview.canvas

    DebugDraw.init( glview.gl )

    this.tests  = new Tests( this.gl )
    this.scenes = new SceneSelector( this.gl )
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



  // load(): Promise<void>{
  //   return this.scenes.load()
  // }


  private _onViewRender = (dt:number)=>{
    dt;
    const gl = this.gl

    this.context.withCamera( this.camera )
    
    this.viewport.setSize(this.glview.width, this.glview.height)
    this.viewport.setupGl(gl)

    const c = this.clearColor
    gl.clearColor(c[0], c[1], c[2], c[3])
    gl.clear( this.gl.COLOR_BUFFER_BIT );
    
    this.renderScene( this.scenes.current )
    
    DebugDraw.render(this.context)
  }

  private renderScene( scene : IScene ){
    if( !scene ) return

    this.cameras.preRender()
    scene.preRender()

    this.camera.updateViewProjectionMatrix(this.viewport.width, this.viewport.height);

    scene.rttPass()
    scene.render(this.context.withMask(RenderMask.OPAQUE))
    scene.render(this.context.withMask(RenderMask.BLENDED))

    // this.tests.render()
    
  }





}