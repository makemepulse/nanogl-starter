import DebugDraw from "@webgl/dev/debugDraw/DebugDraw";
import Light from "nanogl-pbr/lighting/Light";
import LightSetup from "nanogl-pbr/lighting/LightSetup";
import LightType from "nanogl-pbr/lighting/LightType";
import PunctualLight from "nanogl-pbr/lighting/PunctualLight";
import GLState from "nanogl-state";
import GLConfig from "nanogl-state/GLConfig";
import { GLContext } from "nanogl/types";
import { RenderContext } from "./Renderer";
import RenderMask from "./RenderMask";
import RenderPass from "./RenderPass";
import Viewport from "./Viewport";




function isPunctualLight(light: Light): light is PunctualLight {
  return (light._type === LightType.SPOT);
}


export type RenderFunction = (ctx:RenderContext)=>void

export default class LightmapRenderer {




  static render( gl: GLContext, lightSetup: LightSetup ,renderFunction: RenderFunction ) {

    const lights = lightSetup._lights;
    // const depthpass = this.matlib.depthPass;
    const glstate = GLState.get(gl);
    // console.log(this.lighting.lightSetup.depthFormat.value());
    
    const isRgb = lightSetup.depthFormat.value() === 'D_RGB'

    const config = new GLConfig()
      .enableCullface(true)
      .enableDepthTest(true)
      .depthMask(true)
      .colorMask(isRgb, isRgb, isRgb, isRgb);

      let i = 0

    glstate.push(config);
    glstate.apply();

    for (const l of lights) {


      if (isPunctualLight(l)) {
        if (l._castShadows) {
          l.bindShadowmap()
          // console.log( "has depth tex", PixelFormats.getInstance(gl).hasDepthTexture())
          
          // fbodebug.debug( l._fbo );
          
          gl.clearColor(1, 1, 1, 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

          DebugDraw.drawTexture( l._fbo.getColorTexture(), i * 550, 0 )  
          DebugDraw.drawFrustum( l._camera._viewProj )
          
          renderFunction({
            gl,
            viewport: new Viewport(0, 0, l._fbo.width, l._fbo.height ),
            glConfig: config,
            camera: l._camera,
            mask: RenderMask.OPAQUE,
            pass: RenderPass.DEPTH,
          })
          

          
          i++
        }
        
      }
    }

    glstate.pop();
    glstate.apply()
  }

  
}