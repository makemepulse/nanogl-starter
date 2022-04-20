import GLArrayBuffer from 'nanogl/arraybuffer'

import { RenderContext } from "@webgl/core/Renderer";
import { IScene } from "@webgl/engine/IScene";
import Renderer from "@webgl/Renderer";
import Program from 'nanogl/program';
import Node from 'nanogl-node';
import { LiveProgram } from '@webgl/core/LiveShader';

import vShader from './shader.vert'
import fShader from './shader.frag'
import GLState, { LocalConfig } from 'nanogl-state/GLState';
import RenderMask from '@webgl/core/RenderMask';
import { GuiFolder, RangeGui } from '@webgl/dev/gui/decorators';

// const Vert = LiveShader(vShader)
// const Frag = LiveShader(fShader)


@GuiFolder('DrawcallSample')
export default class MinimalDrawcallSample implements IScene {

  private quad: GLArrayBuffer;

  private node : Node = new Node()
  private prg: Program;
  cfg: LocalConfig;

  @RangeGui(0, 1)
  arc = 1.0
  
  @RangeGui(0, 2)
  radius = 1.0

  constructor(private renderer : Renderer ){
    const gl = renderer.gl

    /**
     * custom geometry
     * vertex is a single float describing an angle on a circle
     */
    const vertices = Array(64).fill(0).map((_,i)=>i/64*Math.PI*2)
    this.quad = new GLArrayBuffer(gl, new Float32Array(vertices))
    this.quad.attrib('aAngle', 2, gl.FLOAT)

    
    this.prg = LiveProgram(gl, vShader, fShader)
    
    this.cfg = GLState.get(gl).config()
      .enableDepthTest(true)
      .enableBlend(false)
      .enableCullface(false)
  }




  preRender(): void {
    this.node.updateWorldMatrix()
  }
  
  
  render(context: RenderContext): void {
    
    if( context.mask === RenderMask.OPAQUE ){
      const gl = this.renderer.gl
      
      const prg = this.prg
      const node = this.node
      
      prg.use()
      prg.uMVP( context.camera.getMVP(node._wmatrix) )
      prg.uRadius(this.radius)
      prg.uArc(this.arc)
      
      this.cfg.apply()
      
      this.quad.attribPointer(this.prg)
      this.quad.drawTriangleFan()
    }
  }
  
  
  
  /** useless stuffs */
  load(): Promise<void> {return Promise.resolve()}
  unload(): void {}
  rttPass(): void {}
  
}
