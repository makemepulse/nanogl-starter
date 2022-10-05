
import { RenderContext } from "@webgl/core/Renderer";
import { IScene } from "@webgl/engine/IScene";
import Renderer from "@webgl/Renderer";
import Program from 'nanogl/program';
import { CreateProgram } from '@webgl/core/CreateProgram';

import vShader from './skybox.vert'
import fShader from './skybox.frag'
import RenderMask from '@webgl/core/RenderMask';
import Rect from 'nanogl-primitives-2d/rect';
import AssetDatabase from '@webgl/resources/AssetDatabase';
import { TextureResource } from '@webgl/resources/TextureResource';
import { mat4 } from 'gl-matrix';

const M4 = mat4.create()

/**
 * The sample display a skybox from a simple fullscreen quad and a lat/lng env map.
 */
export default class SkyboxSample implements IScene {

  private quad: Rect;

  private prg: Program;
  private envmap: TextureResource;

  constructor(private renderer: Renderer) {
    const gl = renderer.gl

    this.quad = new Rect(gl)
    this.prg = CreateProgram(gl, vShader, fShader)

    this.envmap = AssetDatabase.getTexture('sample/skybox_ditch_river.jpg', gl)
  }



  render(context: RenderContext): void {
    if ((context.mask & RenderMask.OPAQUE) === 0) return

    /**
     * create inverse view projection matrix with origin at O
     * Used to transform screen space positions of the full screen quad, to world space view-directions
     */
    M4.set( context.camera._viewProj );
    M4[12] = M4[13] = M4[14] = 0;
    mat4.invert(M4, M4);
    

    this.prg.use()
    this.prg.uInverseViewProj(M4)
    this.prg.tEnv(this.envmap.texture)

    this.quad.attribPointer(this.prg)
    this.quad.render()
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
