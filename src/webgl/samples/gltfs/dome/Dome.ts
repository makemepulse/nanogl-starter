import { RenderContext } from "@webgl/core/Renderer";
import RenderMask from "@webgl/core/RenderMask";
import SpherePrimitive from "@webgl/samples/common/SpherePrimitive";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import Program from "nanogl/program";
import { GLContext } from "nanogl/types";

import VS from "./dome.vert";
import FS from "./dome.frag";
import { CreateGui, DeleteGui, GuiFolder, RangeGui } from "@webgl/dev/gui/decorators";
import { IblFormat } from "nanogl-pbr/lighting/IblModel";
import { mat3 } from "gl-matrix";
import Ibl from "nanogl-pbr/lighting/Ibl";
import Programs from "@webgl/glsl/programs";

const M3 = mat3.create();

@GuiFolder("Dome")
/**
 * render hemispherical dome with corner radius
 * use ibl reflection map as texture (support pmrem and octa)
 */
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

  @RangeGui(0, 10)
  projetionHeight = 2.5

  

  constructor(private gl: GLContext, private ibl: Ibl ) {

    this.sphere = new SpherePrimitive(gl)

    // this.envmap = AssetDatabase.getTexture('samples/textures/skybox_ditch_river.jpg', gl)

    this.cfg = GLState.get(gl).config()
      .depthMask(false)
      .enableDepthTest()
      .frontFace(gl.CW)
      .enableCullface()

    CreateGui(this)

  }



  render(context: RenderContext): void {
    if ((context.mask & RenderMask.BLENDED) === 0) return

    this.compilePrg()

    this.prg.use()
    this.prg.uMVP(context.camera._viewProj)
    this.prg.tTex(this.ibl.env)
    this.prg.uParams(this.radius, this.cornerRadius, this.projetionHeight)
    
    // if ibl support rotation, we need to apply it also to the dome
    // ==================================
    if( this.ibl.enableRotation ){
      mat3.fromMat4( M3, this.ibl._wmatrix)
      mat3.invert( M3, M3 )
      this.prg.uEnvMatrix( M3 );
      this.prg.uEnvMatrix(this.radius, this.cornerRadius, this.projetionHeight)
    }


    this.sphere.prepare(this.prg)

    this.cfg.apply()
    this.sphere.draw()
  }

  /**
   * recompile prg if ibl format changed
   */
  compilePrg(){
    if( !this.prg || this.iblFormat !== this.ibl.iblFormat ){
      this.prg = Programs(this.gl).create(VS, FS, `
        #define PMREM 0
        #define OCTA 1
        #define IBL_FORMAT ${this.ibl.iblFormat}
        #define enableRotation ${this.ibl.enableRotation ? 1 : 0}`
      )
    }
  }

  dispose() {
    DeleteGui(this)
  }


}