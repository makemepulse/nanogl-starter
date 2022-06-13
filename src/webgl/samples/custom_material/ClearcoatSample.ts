import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext, isWebgl2 } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import { ClearcoatMetalness } from "./clearcoat/ClearcoatPass"
import { Uniform } from "nanogl-pbr/Input"
import gui from "@webgl/dev/gui"
import CompleteLightSetup from "../common/CompleteLightSetup"
import FloorPlane from "@webgl/samples/common/FloorPlane"
import Bounds from "nanogl-pbr/Bounds"

const GltfPath = "gltfs/suzanne/Suzanne.gltf"
// const GltfPath = "gltfs/fn-509_with_tactical_kit/scene.gltf"
// const GltfPath = "gltfs/ground_control_station_for_uav/scene.gltf"
// const GltfPath = "gltfs/meetmats/astronaut/scene.gltf"


/**
 * Sample scene testing custom clearcoat Material
 * Custom ClearcoatPass (which inherit StandardPass) is created and override the pass created by Gltf loader
 */
export default class ClearcoatSample implements IScene {

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
  floor: FloorPlane

  constructor(renderer: Renderer) {
    this.gl = renderer.gl
    this.root = new Node()
    this.lighting = new Lighting(this.gl)
    this.root.add(this.lighting.root)

    /**
     * preset with all lights types
     */
    this.completeLightSetup = new CompleteLightSetup(this.lighting)

    this.createClearcoatPass()


    this.gltfSample = new GltfScene(GltfPath, this.gl, this.lighting, this.root)



    /**
     * completely replace the gltf material with les clearcoat one
     */
    this.gltfSample.overrides.overridePass("Suzanne", this.clearcoatPass)
   

    /**
     * alternatively, use surface parameters from the original pass
     */
    // this.gltfSample.overrides.overridePass("Suzanne", (ctx, material) => {
    //   const pass = material.getPass('color').pass as StandardMetalness
    //   this.clearcoatPass.setSurface(pass.surface)
    //   return this.clearcoatPass
    // })



    /*
    * add a floor plane for fun
    */
    this.floor = new FloorPlane( renderer.gl )
    this.lighting.setupMaterial(this.floor.material)
    this.floor.node.setScale(4)
    this.root.add( this.floor.node )
  }


  /**
   * create a Clearcoat Pass, setup basic params, and gui
   */
  createClearcoatPass() {

    /**
     * create the custom clercoat pass
     */
    this.clearcoatPass = new ClearcoatMetalness()
    this.clearcoatPass.glconfig
      .enableDepthTest()
      .enableCullface(true);

    // mandatory for now, shadow mapping will fail with a webgl2 context but glsl 100 shader
    this.clearcoatPass.version.set( isWebgl2(this.gl) ? '300 es' : '100' )
    

    // manully set lightSetup on this pass since gltf will not dio it itself
    this.lighting.setupStandardPass(this.clearcoatPass)

    // set red color as glsl constant
    // could attach a uniform if animated, or sampler or geomatry custom attribute here
    this.clearcoatPass.surface.baseColor.attachConstant([.8, .1, .1])
    


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
    this.lighting.renderLightmaps((ctx)=>this.render(ctx) )
  }

  render(context: RenderContext): void {
    this.floor.render( context )
    this.gltfSample.render(context)
  }

  async load(): Promise<void> {
    await this.lighting.load()
    await this.gltfSample.load()

    const lsBounds = this.lighting.lightSetup.bounds
    this.gltfSample.computeStaticBounds(lsBounds)
    this.floor.node.y = lsBounds.min[1]
    const planeBounds= new Bounds()
    planeBounds.fromMinMax([-1, -1, 0], [1, 1, 0])
    this.floor.node.updateWorldMatrix()
    Bounds.transform(planeBounds, planeBounds, this.floor.node._wmatrix)
    Bounds.union(lsBounds, lsBounds, planeBounds)
  }

  unload(): void {
    gui.clearFolder('Clearcoat')
    this.lighting.dispose()
  }

}