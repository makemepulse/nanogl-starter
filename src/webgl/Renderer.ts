import { vec4 } from "gl-matrix";
import Camera from "nanogl-camera";
import Node from "nanogl-node";
import GLState from "nanogl-state";
import { GLContext } from "nanogl/types";
import Cameras from "./cameras/Cameras";
import IRenderer from "./core/IRenderer";
import DebugDraw from "./dev/debugDraw/DebugDraw";
import { ColorGui } from "./dev/gui/decorators";
import Programs from "./glsl/programs";
import GLView from "./GLView";
import Tests from "./tests";


export default class Renderer implements IRenderer {


  ilayer    : HTMLElement
  root      : Node
  cameras   : Cameras
  programs  : Programs
  glstate   : GLState

  @ColorGui
  clearColor = vec4.fromValues(.95, .95, .95, 1)
  tests: Tests;

  

  constructor( readonly glview : GLView ){

    glview.onRender.on( this._onViewRender )

    this.glstate = new GLState( this.gl )
    this.ilayer = glview.canvas

    DebugDraw.init( this )

    this.root = new Node()
    this.cameras = new Cameras(this)
    this.programs = new Programs( this.gl )

    this.tests = new Tests( this )

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

  private renderScene(){
    this.tests.render()
    0
  }





}