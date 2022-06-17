import { RenderContext } from "@webgl/core/Renderer";
import { GLContext } from "nanogl/types";
import FloorPlane from "@webgl/samples/common/FloorPlane";
import UnlitPass from "nanogl-pbr/UnlitPass";
import Texture2D from "nanogl/texture-2d";
import TexCoord from "nanogl-pbr/TexCoord";
import { Sampler } from "nanogl-pbr/Input";



export class TexturedQuad {

  plane: FloorPlane;
  unlitPass: UnlitPass;

  constructor(gl: GLContext) {
    this.plane = new FloorPlane(gl);
    this.unlitPass = new UnlitPass();
    this.unlitPass.glconfig
      .enableDepthTest()
      .enableBlend()
      .blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.unlitPass.alphaMode.set("BLEND");

    this.plane.material.addPass(this.unlitPass);
  }

  setTexture(t: Texture2D) {
    const sampler = new Sampler('color', TexCoord.create('aTexCoord'));
    sampler.set(t);
    this.unlitPass.baseColor.attach(sampler, 'rgb');
    this.unlitPass.alpha.attach(sampler, 'a');
  }

  render(context: RenderContext) {
    this.plane.render(context);
  }

}
