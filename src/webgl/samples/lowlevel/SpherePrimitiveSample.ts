
import { RenderContext } from "@webgl/core/Renderer";
import { IScene } from "@webgl/engine/IScene";
import Renderer from "@webgl/Renderer";
import Program from 'nanogl/program';
import { CreateProgram } from '@webgl/core/CreateProgram';

import vShader from './sphere.vert'
import fShader from './sphere.frag'
import RenderMask from '@webgl/core/RenderMask';
import AssetDatabase from '@webgl/resources/AssetDatabase';
import { TextureResource } from '@webgl/resources/TextureResource';
import SpherePrimitive from "../common/SpherePrimitive";
import GLState from "nanogl-state/GLState";
import GLConfig from "nanogl-state/GLConfig";


/**
 * demonstarte construction of a simple primitive geometry in SphereGeometry
 * and basic draw call with it
 */
export default class SpherePrimitiveSample implements IScene {

  private sphere: SpherePrimitive;

  private prg: Program;
  private envmap: TextureResource;

  constructor(private renderer: Renderer) {
    const gl = renderer.gl

    this.sphere = new SpherePrimitive(gl, 16, 24)
    this.prg = CreateProgram(gl, vShader, fShader)

    this.envmap = AssetDatabase.getTexture('samples/textures/skybox_ditch_river.jpg', gl)


  }



  render(context: RenderContext): void {
    if ((context.mask & RenderMask.OPAQUE) === 0) return

    const glstate = GLState.get(context.gl)

    glstate.push(new GLConfig().enableDepthTest())
    glstate.apply()
    
    this.prg.use()
    this.prg.uMVP(context.camera._viewProj)
    this.prg.tTex(this.envmap.texture)
    
    this.sphere.prepare(this.prg)
    this.sphere.draw()
    glstate.pop()
  }




  /** useless stuffs */
  load(): Promise<void> {
    return this.envmap.load().then()
  }

  unload(): void {
    this.envmap.unload()
  }

  rttPass(): void { 0 }
  preRender(): void { 0 }

}
