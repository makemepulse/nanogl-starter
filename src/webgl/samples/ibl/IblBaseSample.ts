import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import { Uniform } from "nanogl-pbr/Input"
import { StandardMetalness } from "nanogl-pbr/StandardPass"
import SpherePrimitive from "../common/SpherePrimitive"
import IblDevLook from "./IblDevLook"

// const GltfPath = "samples/suzanne/suzanne.gltf"
const GltfPath = "samples/suzanne/suzanne.gltf"
// const GltfPath = "gltfs/fn-509_with_tactical_kit/scene.gltf"
// const GltfPath = "gltfs/ground_control_station_for_uav/scene.gltf"
// const GltfPath = "gltfs/meetmats/astronaut/scene.gltf"


/**
 * Sample scene 
 */
export default abstract class IblBaseSample implements IScene {

  readonly gl: GLContext
  gltfSample: GltfScene
  lighting: Lighting
  root: Node
  materialPass: StandardMetalness
  iblDevLook : IblDevLook

  color     : Uniform
  smoothness: Uniform
  metalness : Uniform
  sphere: SpherePrimitive
  spherePass: void

  constructor(renderer: Renderer) {

    this.gl = renderer.gl
    this.root = new Node()
    this.lighting = new Lighting(this.gl)
    this.root.add(this.lighting.root)

    this.gltfSample = new GltfScene(GltfPath, this.gl, this.lighting, this.root)

    this.sphere = new SpherePrimitive(this.gl)
    this.iblDevLook = new IblDevLook(this.gl)
    this.iblDevLook.setupLighting(this.lighting)
    this.iblDevLook.root.y = 1.5
    this.root.add(this.iblDevLook.root)


  }


  abstract loadIbl() : Promise<void>;



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
    this.iblDevLook.render(context)
  }

  

  async load(): Promise<void> {
    await this.loadIbl()
    await this.gltfSample.load()

    const lsBounds = this.lighting.lightSetup.bounds
    this.gltfSample.computeStaticBounds(lsBounds)
  }

  unload(): void {
    this.lighting.dispose()
  }

}