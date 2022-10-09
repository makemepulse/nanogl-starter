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

  sampler: Sampler;

  constructor(gl: GLContext) {

    this.plane = new FloorPlane(gl);

    this.unlitPass = new UnlitPass();
    this.unlitPass.glconfig
      .enableDepthTest()
      .enableBlend()
      .blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.unlitPass.alphaMode.set("BLEND");
    this.plane.material.addPass(this.unlitPass);
    

    this.sampler = new Sampler('color', TexCoord.create('aTexCoord'));

    this.unlitPass.baseColor.attach(this.sampler, 'rgb');
    this.unlitPass.alpha    .attach(this.sampler, 'a'  );
  }


  setTexture(t: Texture2D) {
    this.sampler.set(t);
  }


  render(context: RenderContext) {
    this.plane.render(context);
  }



  private static _intances = new WeakMap<GLContext, TexturedQuad>();

  /**
   * render a horizontal quad with the given texture, at x/y position
   */
  static renderQuad(context: RenderContext, t: Texture2D, x = 0, y = 0 ) {
    const gl = context.gl;
    if (!this._intances.has(gl)) {
      this._intances.set(gl, new TexturedQuad(gl));
    }
    const quad = this._intances.get(gl)

    quad.plane.node.x = x
    quad.plane.node.y = y
    quad.plane.node.setScale(.5)
    quad.plane.node.updateWorldMatrix()
    quad.setTexture(t);
    quad.render(context);
  }
}
