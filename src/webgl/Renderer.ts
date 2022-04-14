import { vec4 } from "gl-matrix";
import Camera from "nanogl-camera";
import { GLContext } from "nanogl/types";
import Cameras from "./cameras/Cameras";
import Capabilities from "./core/Capabilities";
import { MainRenderContext } from "./core/Renderer";
import RenderMask from "./core/RenderMask";
import Viewport from "./core/Viewport";
import DebugDraw from "./dev/debugDraw/DebugDraw";
import { ColorGui } from "./dev/gui/decorators";
import GLView from "./GLView";
import { IScene } from "./engine/IScene";
import SamplesSelector from "./samples/SamplesSelector";

export default class Renderer {


  ilayer    : HTMLElement
  cameras   : Cameras

  @ColorGui({folder:'General'})
  clearColor = vec4.fromValues(.2, .2, .2, 1)
  
  samples: SamplesSelector

  /**
   * main backbuffer viewport
   */
  readonly viewport = new Viewport()
  
  readonly context: MainRenderContext;

  

  constructor( readonly glview : GLView ){

    glview.onRender.on( this._onViewRender )

    this.ilayer = glview.canvas

    DebugDraw.init( glview.gl )

    this.samples = new SamplesSelector( this )
    this.cameras = new Cameras(this)
    this.context = new MainRenderContext( this.gl, this.viewport )

    Capabilities(this.gl).report()
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
    
    this.context.withCamera( this.camera )
    
    this.viewport.setSize(this.glview.width, this.glview.height)
    
    
    this.renderScene( this.samples.current )
    
    DebugDraw.render(this.context)
  }
  
  private renderScene( scene : IScene ){
    if( !scene ) return
    const gl = this.gl
    
    this.cameras.preRender()
    scene.preRender()
    
    this.camera.updateViewProjectionMatrix(this.viewport.width, this.viewport.height);
    
    scene.rttPass()
    

    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.viewport.setupGl(gl)
    const c = this.clearColor
    gl.clearColor(c[0], c[1], c[2], c[3])
    gl.clear( this.gl.COLOR_BUFFER_BIT );

    scene.render(this.context.withMask(RenderMask.OPAQUE))
    scene.render(this.context.withMask(RenderMask.BLENDED))

    // this.tests.render()
    
  }





}