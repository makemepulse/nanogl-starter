import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext, isWebgl2 } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import { Uniform } from "nanogl-pbr/Input"
import gui from "@webgl/dev/gui"
import { StandardMetalness } from "nanogl-pbr/StandardPass"

// const GltfPath = "samples/suzanne/suzanne.gltf"
const GltfPath = "samples/suzanne/suzanne.gltf"
// const GltfPath = "gltfs/fn-509_with_tactical_kit/scene.gltf"
// const GltfPath = "gltfs/ground_control_station_for_uav/scene.gltf"
// const GltfPath = "gltfs/meetmats/astronaut/scene.gltf"


/**
 * Sample scene testing custom clearcoat Material
 * Custom materialPass (which inherit StandardPass) is created and override the pass created by Gltf loader
 */
export default abstract class IblBaseSample implements IScene {

  readonly gl: GLContext
  gltfSample: GltfScene
  lighting: Lighting
  root: Node
  materialPass: StandardMetalness

  color     : Uniform
  smoothness: Uniform
  metalness : Uniform

  constructor(renderer: Renderer) {

    this.gl = renderer.gl
    this.root = new Node()
    this.lighting = new Lighting(this.gl)
    this.root.add(this.lighting.root)

    this.gltfSample = new GltfScene(GltfPath, this.gl, this.lighting, this.root)


    this.createMaterialPass()
    /**
     * completely replace the gltf material with les clearcoat one
     */
    // this.gltfSample.overrides.overridePass("Suzanne", this.materialPass)

  }


  abstract loadIbl() : Promise<void>;

  /**
   * create a Clearcoat Pass, setup basic params, and gui
   */
  createMaterialPass() {

    /**
     * create the custom clercoat pass
     */
    this.materialPass = new StandardMetalness()
    this.materialPass.glconfig
      .enableDepthTest()
      .enableCullface(true);

    // mandatory for now, shadow mapping will fail with a webgl2 context but glsl 100 shader
    this.materialPass.version.set( isWebgl2(this.gl) ? '300 es' : '100' )
    
    // manully set lightSetup on this pass since gltf will not dio it itself
    this.lighting.setupStandardPass(this.materialPass)

    // set red color as glsl constant
    // could attach a uniform if animated, or sampler or geomatry custom attribute here
    this.color = this.materialPass.surface.baseColor.attachUniform()
    this.smoothness = this.materialPass.surface.roughness.attachUniform()
    this.metalness = this.materialPass.surface.metalness.attachUniform()

    this.color.set(1, 1, 1)
    this.smoothness.set(.25)
    this.metalness.set(0)


  }

  preRender(): void {
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }

  rttPass(): void {
    this.lighting.lightSetup.prepare(this.gl);
    this.lighting.renderLightmaps((ctx)=>this.render(ctx) )
  }

  render(context: RenderContext): void {
    this.gltfSample.render(context)
  }

  async load(): Promise<void> {

    const f = gui.folder('Ibl')
    f.addColor(this.color, 'value' ).setLabel('Color')
    f.range(this.smoothness, 'x', 0, 1).setLabel('Roughness')
    f.range(this.metalness, 'x', 0, 1).setLabel('Metalness')

    await this.loadIbl()
    await this.gltfSample.load()

    const lsBounds = this.lighting.lightSetup.bounds
    this.gltfSample.computeStaticBounds(lsBounds)
  }

  unload(): void {
    gui.clearFolder('Ibl')
    this.lighting.dispose()
  }

}