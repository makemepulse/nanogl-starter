import { AssetsPath } from "@/core/PublicPath"
import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import { IGLContextProvider } from "@webgl/resources/IGLContextProvider"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import { ClearcoatMetalness } from "./clearcoat/ClearcoatPass"
import { Uniform } from "nanogl-pbr/Input"
import gui from "@webgl/dev/gui"
import CompleteLightSetup from "../common/CompleteLightSetup"

const GltfPath = "webgl/suzanne/Suzanne.gltf"
// const GltfPath = "webgl/fn-509_with_tactical_kit/scene.gltf"
// const GltfPath = "webgl/ground_control_station_for_uav/scene.gltf"




export default class ClearcoatSample implements IGLContextProvider, IScene {

  readonly gl: GLContext
  gltfSample: GltfScene
  lighting: Lighting
  root: Node
  clearcoatPass: ClearcoatMetalness
  // clearcoatPass: StandardMetalness
  ccSmoothness: Uniform
  smoothness: Uniform
  metalness: Uniform
  completeLightSetup: CompleteLightSetup

  constructor(renderer: Renderer) {
    this.gl = renderer.gl
    this.root = new Node()
    this.lighting = new Lighting(this.gl)
    this.root.add(this.lighting.root)


    this.createClearcoatPass()


    this.gltfSample = new GltfScene(AssetsPath(GltfPath), this.gl, this.lighting, this.root)



    /**
     * replace the gltf material with les clearcoat one
     */
    this.gltfSample.overrides.overridePass("Suzanne", this.clearcoatPass)
   

    /**
     * alternatively, use surface parameter from the original pass
     */
    // this.gltfSample.overrides.overridePass("Suzanne", (ctx, material) => {
    //   const pass = material.getPass('color').pass as StandardMetalness
    //   this.clearcoatPass.setSurface(pass.surface)
    //   return this.clearcoatPass
    // })


    /**
     * preset with all lights types
     */
    this.completeLightSetup = new CompleteLightSetup(this.lighting)

  }


  /**
   * create a Clearcoat Pass, setup basic params, and gui
   */
  createClearcoatPass() {

    /**
     * create the custom clercoat pass
     */
    this.clearcoatPass = new ClearcoatMetalness()
    this.clearcoatPass.glconfig.enableDepthTest();
    this.clearcoatPass.glconfig.enableCullface(true);

    // set red color
    this.clearcoatPass.surface.baseColor.attachConstant([.8, .1, .1])


    this.lighting.setupStandardPass(this.clearcoatPass)


    this.ccSmoothness = this.clearcoatPass.clearcoatSmoothness.attachUniform()
    this.smoothness = this.clearcoatPass.surface.roughness.attachUniform()
    this.metalness = this.clearcoatPass.surface.metalness.attachUniform()

    this.ccSmoothness.set(1)
    this.smoothness.set(.75)
    this.metalness.set(1)

    const f = gui.folder('Clearcoat')
    f.range(this.smoothness, 'x', 0, 1).setLabel('Roughness')
    f.range(this.metalness, 'x', 0, 1).setLabel('Metalness')
    f.range(this.ccSmoothness, 'x', 0, 1).setLabel('CC Smoothness')

  }

  preRender(): void {
    this.completeLightSetup.preRender()
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }

  rttPass(): void {
    this.lighting.lightSetup.prepare(this.gl);
  }

  render(context: RenderContext): void {
    this.gltfSample.render(context)
  }

  async load(): Promise<void> {
    await this.lighting.load()
    await this.gltfSample.load()

    this.gltfSample.computeStaticBounds(this.lighting.lightSetup.bounds)
  }

  unload(): void {
    gui.clearFolder('Clearcoat')
    this.lighting.dispose()
  }

}