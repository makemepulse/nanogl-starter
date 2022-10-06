import { CreateProgram } from "@webgl/core/CreateProgram";
import { RenderContext } from "@webgl/core/Renderer";
import RenderMask from "@webgl/core/RenderMask";
import IblLight from "@webgl/engine/IblLight";
import SpherePrimitive from "@webgl/samples/common/SpherePrimitive";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import Program from "nanogl/program";
import { GLContext } from "nanogl/types";

import VS from "./dome.vert";
import FS from "./dome.frag";
import { CreateGui, DeleteGui, GuiFolder, RangeGui } from "@webgl/dev/gui/decorators";
import { IblFormat } from "nanogl-pbr/lighting/IblModel";

@GuiFolder("Dome")
export default class Dome {

  private sphere: SpherePrimitive;
  private prg: Program = null;
  private iblFormat: IblFormat = null

  // private envmap: TextureResource;
  private cfg: LocalConfig;

  @RangeGui(5, 50)
  radius = 30
  
  @RangeGui(0, 10)
  cornerRadius = 10

  @RangeGui(0, 3)
  projetionHeight = 2.5

  

  constructor(private gl: GLContext, private ibl: IblLight ) {

    this.sphere = new SpherePrimitive(gl)

    // this.envmap = AssetDatabase.getTexture('samples/textures/skybox_ditch_river.jpg', gl)

    this.cfg = GLState.get(gl).config()
      .enableDepthTest()

    CreateGui(this)

  }



  render(context: RenderContext): void {
    if ((context.mask & RenderMask.BLENDED) === 0) return

    this.compilePrg()

    this.prg.use()
    this.prg.uMVP(context.camera._viewProj)
    this.prg.tTex(this.ibl.env)
    this.prg.uParams(this.radius, this.cornerRadius, this.projetionHeight)
    
    this.sphere.prepare(this.prg)

    this.cfg.apply()
    this.sphere.draw()
  }


  compilePrg(){
    if( !this.prg || this.iblFormat !== this.ibl.iblFormat ){
      this.prg = CreateProgram(this.gl, VS, FS, `#define PMREM 0\n #define OCTA 1\n #define IBL_FORMAT ${this.ibl.iblFormat}`)
    }
  }

  dispose() {
    DeleteGui(this)
  }


}