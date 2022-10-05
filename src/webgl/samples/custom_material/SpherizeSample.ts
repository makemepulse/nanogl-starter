import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import gui from "@webgl/dev/gui"
import { Uniform } from "nanogl-pbr/Input"
import FloorPlane from "@webgl/samples/common/FloorPlane"
import CompleteLightSetup from "../common/CompleteLightSetup"
import Bounds from "nanogl-pbr/Bounds"
import DepthPass from "nanogl-pbr/DepthPass"
import Spherize from "./spherize_fx/Spherize"

const GltfPath = "samples/suzanne/suzanne.gltf"



/**
 * illustrate vertex deformation with Chunk injection
 */
export default class SpherizeSample implements IScene {

  readonly gl: GLContext
  gltfSample: GltfScene
  lighting: Lighting
  root: Node
  // clearcoatPass: StandardMetalness
  spherizeEffect: Spherize

  spherizeRadius: Uniform
  spherizeAmount: Uniform
  floor: FloorPlane
  completeLightSetup: CompleteLightSetup
  depthPass: DepthPass
  spherizeCenter: Uniform

  constructor(renderer: Renderer) {
    this.gl = renderer.gl
    this.root = new Node()
    this.lighting = new Lighting(this.gl)
    this.root.add(this.lighting.root)

    
    this.spherizeEffect = new Spherize()
    
    this.spherizeRadius = this.spherizeEffect.radius.attachUniform()
    this.spherizeAmount = this.spherizeEffect.amount.attachUniform()

    this.spherizeRadius.set(1)
    this.spherizeAmount.set(.5)

    const f = gui.folder('Spherize Effect')
    f.range(this.spherizeRadius, 'x', 0, 10).setLabel('Radius')
    f.range(this.spherizeAmount, 'x', 0, 1).setLabel('Amount')
    f.open()


    this.gltfSample = new GltfScene(GltfPath, this.gl, this.lighting, this.root)

    /**
     * setup an override to add the disolve effect to every materials
     * Note that the chunk is added to the material itself, not the color pass.
     * this way chunk is applied to every passes of the material, color AND depth pass
     * and the shadowmapping work correctly
     */
    this.gltfSample.overrides.overridePass( "", (ctx, material)=>{
      material.inputs.add( this.spherizeEffect )
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
    gui.clearFolder('Spherize Effect')
    this.lighting.dispose()
  }

}