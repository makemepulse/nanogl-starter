
import { RenderContext } from "@webgl/core/Renderer";
import { IScene } from "@webgl/engine/IScene";
import Renderer from "@webgl/Renderer";
import Program from 'nanogl/program';

import vShader from './quad.vert'
import fShader from './quad.frag'
import RenderMask from '@webgl/core/RenderMask';
import GLState, { LocalConfig } from 'nanogl-state/GLState';
import Rect from 'nanogl-primitives-2d/rect';
import { mat4 } from "gl-matrix";
import GLConfig from "nanogl-state/GLConfig";
import Programs from "@webgl/glsl/programs";

const M4 = mat4.create()
/**
 * Sample of GLState usage
 * GLState work by tracking the compound state of a stack of configs
 * One config define a set of state to be applied to the gl context.
 */
export default class GLStateSample implements IScene {
  
  private quad: Rect;

  private prg: Program;

  private depthTestConfig: GLConfig
  private additiveBlendConfig: GLConfig
  private cullfaceConfig: GLConfig
  private localConfig: LocalConfig

  
  constructor(private renderer : Renderer ){
    const gl = renderer.gl

    this.quad = new Rect(gl)
    this.prg = Programs(gl).create(vShader, fShader)

    this.depthTestConfig = new GLConfig()
      .enableDepthTest()

    this.additiveBlendConfig = new GLConfig()
      .enableBlend()
      .blendFunc(gl.ONE, gl.ONE)

    this.cullfaceConfig = new GLConfig()
      .enableCullface()
      .cullFace(gl.FRONT)
    
    this.localConfig = GLState.get( gl ).config()
      .enableDepthTest()
    
  }

  renderQuadAtXPosition(context: RenderContext, x: number ){
    M4[12] = x
    this.prg.uMVP( context.camera.getMVP(M4) )
    this.quad.render()
  }

  
  render(context: RenderContext): void {
    /*
     * only draw during the Opaque render queue
     */
    if( (context.mask & RenderMask.OPAQUE) === 0 ) return

    const glState = GLState.get( context.gl )
    
    // setup once for all the quads
    this.prg.use()
    this.quad.attribPointer(this.prg)
    

    // apply the current GLState stack, here the stack is empty so the gl state is set to default state (no depth test, no blending, etc...)
    glState.apply()
    this.renderQuadAtXPosition(context, 0 )
    



    // For the second quad we push a config to add depth test
    glState.push(this.depthTestConfig)
    // apply the stack of config, GLState check the mutation made by the configs added or removed since the last "apply()" and set the modified states on the context
    glState.apply() 
    this.renderQuadAtXPosition(context, 3 )



    // We push another config to the stack, note that the "depthTestConfig" is still in the stack, so it will still be applied
    glState.push(this.additiveBlendConfig)
    // apply the stack, only blending related call are made since it's the only config added since last apply()
    glState.apply() 
    this.renderQuadAtXPosition(context, 6 )


    // We push another config to the stack, note that the "depthTestConfig" is still in the stack, so it will still be applied
    glState.pop()
    glState.push(this.cullfaceConfig)
    glState.push(this.additiveBlendConfig)
    // apply the stack, even if the additiveBlendConfig have been removed then added back, the blend state don't need to be change since the last apply(), only culling state is actually modified
    glState.apply() 
    this.renderQuadAtXPosition(context, 9 )


    // make sure to pop all config added previously, to avoid overflow
    glState.pop()
    glState.pop()
    glState.pop()
  }
  
  
  
  
  /** useless stuffs */
  load(): Promise<void> {return Promise.resolve()}
  rttPass(): void {0}
  preRender(): void {0}
  unload(): void {0}
  
}
