import GLArrayBuffer from 'nanogl/arraybuffer'

import { RenderContext } from "@webgl/core/Renderer";
import { IScene } from "@webgl/engine/IScene";
import Renderer from "@webgl/Renderer";
import Program from 'nanogl/program';
import { CreateProgram } from '@webgl/core/CreateProgram';

import vShader from './circle.vert'
import fShader from './circle.frag'
import RenderMask from '@webgl/core/RenderMask';
import { CreateGui, DeleteGui, GuiFolder, RangeGui } from '@webgl/dev/gui/decorators';

/**
 * Most basic, low level draw call using just core nanogl features
 * It draw a disc made of 64 vertices.
 * It create an ArrayBuffer of 64 vertices containing a single float attribute, the angle for 0 to 2PI of the vertex on the disc and render it use a custom Program
 */
@GuiFolder('Minimal Drawcall Sample')
export default class MinimalDrawcallSample implements IScene {
  
  private geom: GLArrayBuffer;

  private prg: Program;

  @RangeGui(0, 1)
  arc = 1.0
  
  @RangeGui(0, 2)
  radius = 1.0

  
  constructor(private renderer : Renderer ){
    const gl = renderer.gl

    /**
     * custom geometry, a vertex is a single float describing an angle on a circle
     */
    const vertices = new Float32Array(64).map((_,i)=>i/64*Math.PI*2)
    this.geom = new GLArrayBuffer(gl, vertices)
      .attrib('aAngle', 1, gl.FLOAT)

    /*
     * CreateProgram utility provide a WebglProgram which update automatically 
     * when one of it's shader is updated (using webpack HMR)
     */
    this.prg = CreateProgram(gl, vShader, fShader)


    /*
     * Create the GUI defined by @decorators
     */
    CreateGui(this)
    
  }

  
  
  render(context: RenderContext): void {
    /*
     * only draw during the Opaque render queue
     */
    if( (context.mask & RenderMask.OPAQUE) === 0 ) return

    /*
     * Use and setup the program's uniforms
     */
    this.prg.use()
    this.prg.uMVP( context.camera._viewProj )
    this.prg.uParams(this.radius, this.arc)
    
    /*
     * bind the geometry and draw it 
     */
    this.geom.attribPointer(this.prg)
    this.geom.drawTriangleFan()
  }
  
  
  
  unload(): void {
    /*
     * delete the GUI defined by @decorators
     */
    DeleteGui(this)
  }
  
  /** useless stuffs */
  load(): Promise<void> {return Promise.resolve()}
  rttPass(): void {0}
  preRender(): void {0}
  
}
