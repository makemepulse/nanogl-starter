import GLArrayBuffer from 'nanogl/arraybuffer'

import { RenderContext } from "@webgl/core/Renderer";
import { IScene } from "@webgl/engine/IScene";
import Renderer from "@webgl/Renderer";
import Program from 'nanogl/program';
import { CreateProgram } from '@webgl/core/CreateProgram';

import vShader from './shader.vert'
import fShader from './shader.frag'
import RenderMask from '@webgl/core/RenderMask';
import { CreateGui, DeleteGui, GuiFolder, RangeGui } from '@webgl/dev/gui/decorators';


@GuiFolder('DrawcallSample')
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


    CreateGui(this)
    
  }

  
  
  render(context: RenderContext): void {
    if( context.mask !== RenderMask.OPAQUE ) return
    
    this.prg.use()
    this.prg.uMVP( context.camera._viewProj )
    this.prg.uParams(this.radius, this.arc)
    
    this.geom.attribPointer(this.prg)
    this.geom.drawTriangleFan()
  }
  
  
  
  unload(): void {
    DeleteGui(this)
  }
  
  /** useless stuffs */
  load(): Promise<void> {return Promise.resolve()}
  rttPass(): void {0}
  preRender(): void {0}
  
}
