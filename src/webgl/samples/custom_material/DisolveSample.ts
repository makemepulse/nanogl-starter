import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import gui from "@webgl/dev/gui"
import DisolveFX from "./disolve_fx/DisolveFX"
import { Uniform } from "nanogl-pbr/Input"
import FloorPlane from "@webgl/engine/FloorPlane"
import CompleteLightSetup from "../common/CompleteLightSetup"
import Bounds from "nanogl-pbr/Bounds"
import DepthPass from "nanogl-pbr/DepthPass"

const GltfPath = "gltfs/suzanne/Suzanne.gltf"
// const GltfPath = "gltfs/fn-509_with_tactical_kit/scene.gltf"
// const GltfPath = "gltfs/ground_control_station_for_uav/scene.gltf"
// const GltfPath = "gltfs/adam/Lu_Scene_recorded.gltf"



/**
 * Sample scene testing glsl code injection via Chunk objects to alter existing material (standard pbr)
 * An override is setup on the gltf loader to add a custom chunk to every materials
 * The chunk is DisolveFX, whick add some input (scale and threshold) and discard fragment based on 3D noise vs thrshold test
 */
export default class DisolveSample implements IScene {

  readonly gl: GLContext
  gltfSample: GltfScene
  lighting: Lighting
  root: Node
  // clearcoatPass: StandardMetalness
  disolveEffect: DisolveFX

  disolveScale: Uniform
  disolveThreshold: Uniform
  floor: FloorPlane
  completeLightSetup: CompleteLightSetup
  depthPass: DepthPass

  constructor(renderer: Renderer) {
    this.gl = renderer.gl
    this.root = new Node()
    this.lighting = new Lighting(this.gl)
    this.root.add(this.lighting.root)

    
    this.disolveEffect = new DisolveFX()
    
    this.disolveScale = this.disolveEffect.scale.attachUniform()
    this.disolveThreshold = this.disolveEffect.threshold.attachUniform()
    this.disolveScale.set(1)
    this.disolveThreshold.set(.5)

    const f = gui.folder('Disolve Effect')
    f.range(this.disolveScale, 'x', 0, 10).setLabel('Scale')
    f.range(this.disolveThreshold, 'x', 0, 1).setLabel('Threshold')



    this.gltfSample = new GltfScene(GltfPath, this.gl, this.lighting, this.root)

    /**
     * setup an override to add the disolve effect to every materials
     * Note that the chunk is added to the material itself, not the color pass.
     * this way chunk is applied to every passes of the material, color AND depth pass
     * and the shadowmapping work correctly
     */
    this.gltfSample.overrides.overridePass( "", (ctx, material)=>{
      material.inputs.add( this.disolveEffect )
      this.lighting.setupMaterial(material)
      material.getPass('color').pass.glconfig
        .enableCullface(false)

      return null
    })



    /*
    * add a floor plane for fun
    */
    this.floor = new FloorPlane( renderer.gl )
    this.lighting.setupMaterial(this.floor.material)
    this.floor.node.setScale(4)
    this.root.add( this.floor.node )
    

    /**
     * preset with all lights types
     */
    this.completeLightSetup = new CompleteLightSetup(this.lighting)
    this.completeLightSetup.debugdraw = false
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

    /*
     * light setup need scene boundaries to figure out shadowmaps projections
     * needed if shadows are enabled on lights
     */
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
    gui.clearFolder('Disolve Effect')
    this.lighting.dispose()
  }

}