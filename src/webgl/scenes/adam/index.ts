import { AssetsPath } from "@/core/PublicPath"
import { RenderContext } from "@webgl/core/Renderer"
import RenderMask from "@webgl/core/RenderMask"
import RenderPass from "@webgl/core/RenderPass"
import Viewport from "@webgl/core/Viewport"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import { LightCollection } from "@webgl/lib/nanogl-gltf/lib/extensions/KHR_lights_punctual"
import { IGLContextProvider } from "@webgl/resources/IGLContextProvider"
import Node from "nanogl-node"
import DepthPass from "nanogl-pbr/DepthPass"
import Light from "nanogl-pbr/lighting/Light"
import LightType from "nanogl-pbr/lighting/LightType"
import PunctualLight from "nanogl-pbr/lighting/PunctualLight"
import SpotLight from "nanogl-pbr/lighting/SpotLight"
import PixelFormats from "nanogl-pf"
import GLState from "nanogl-state"
import GLConfig from "nanogl-state/GLConfig"
import { GLContext } from "nanogl/types"
import { GltfScene } from "../GltfScene"
import { IScene } from "../IScene"
import Lighting from "../Lighting"



function isPunctualLight(light: Light): light is PunctualLight {
  return (light._type === LightType.SPOT);
}

export default class AdamScene implements IGLContextProvider, IScene {

  readonly gl: GLContext
  gltfSample: GltfScene
  lighting: Lighting
  root: Node
  depthPass: DepthPass

  constructor(gl: GLContext) {
    this.gl = gl
    this.root = new Node()
    this.lighting = new Lighting(this.gl)
    this.root.add(this.lighting.root)
    this.gltfSample = new GltfScene(AssetsPath("webgl/adam/Lu_Scene_recorded.gltf"), gl, this.lighting, this.root)
  }

  preRender(): void {
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }

  rttPass(): void {
    this.lighting.lightSetup.prepare(this.gl);
    this.renderLightmaps()
  }

  render(context: RenderContext): void {
    this.gltfSample.render(context)
  }

  async load(): Promise<void> {
    await this.lighting.load()
    await this.gltfSample.load()
    const lights: LightCollection = this.gltfSample.gltf.extras.lights
    for (const l of lights.list) {
      this.lighting.lightSetup.add(l)
    }
    
    const mainSpot = lights.getLightByName("SpotMain") as SpotLight
    if( isPunctualLight(mainSpot ) ){
      mainSpot.castShadows(true)
    }

    if (this.gltfSample.gltf.animations[0]) {
      this.gltfSample.playAnimation(this.gltfSample.gltf.animations[0].name)
    }

  }


  renderLightmaps() {

    const gl = this.gl;
    const lights = this.lighting.lightSetup._lights;
    // const depthpass = this.matlib.depthPass;
    const glstate = GLState.get(gl);
    // console.log(this.lighting.lightSetup.depthFormat.value());
    
    const isRgb = this.lighting.lightSetup.depthFormat.value() === 'D_RGB'

    const config = new GLConfig()
      .enableCullface(true)
      .enableDepthTest(true)
      .depthMask(true)
      .colorMask(isRgb, isRgb, isRgb, isRgb);

      let i = 0
    for (const l of lights) {


      if (isPunctualLight(l)) {
        if (l._castShadows) {
          l.bindShadowmap()
          // console.log( "has depth tex", PixelFormats.getInstance(gl).hasDepthTexture())
          
          // fbodebug.debug( l._fbo );
          glstate.push(config);
          glstate.apply();
          
          gl.clearColor(1, 1, 1, 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          
          this.gltfSample.render({
            gl,
            viewport: new Viewport(0, 0, l._fbo.width, l._fbo.height ),
            glConfig: config,
            camera: l._camera,
            mask: RenderMask.OPAQUE,
            pass: RenderPass.DEPTH,
          })
          
          DebugDraw.drawTexture( l._fbo.getColorTexture(), i * 550, 0 )  
          DebugDraw.drawFrustum( l._camera._viewProj )

          glstate.pop();

          i++
        }

      }
    }
    glstate.apply();
  }





  unload(): void {
    this.lighting.dispose()
  }

}