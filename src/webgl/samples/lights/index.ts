import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import SpotLight from "nanogl-pbr/lighting/SpotLight"
import FloorPlane from "@webgl/samples/common/FloorPlane"
import CompleteLightSetup from "../common/CompleteLightSetup"
import Bounds from "nanogl-pbr/Bounds"

const GltfPath = "gltfs/suzanne/Suzanne.gltf"
// const GltfPath = "gltfs/fn-509_with_tactical_kit/scene.gltf"
// const GltfPath = "gltfs/ground_control_station_for_uav/scene.gltf"

export default class LightsScene implements IScene {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  root       : Node
  spotLight: SpotLight
  floor: FloorPlane
  completeLightSetup: CompleteLightSetup
  
  constructor( renderer:Renderer ){
    this.gl = renderer.gl
    this.root       = new Node()
    this.lighting   = new Lighting( this.gl )
    this.root.add( this.lighting.root )
    this.gltfSample = new GltfScene( GltfPath, this.gl, this.lighting, this.root )

    /**
     * remove initial ibl light added by default by Lighting
     */
    this.lighting.lightSetup.remove( this.lighting.ibl )


    /**
     * preset with all lights types
     */
    this.completeLightSetup = new CompleteLightSetup( this.lighting )

    
    /*
     * add a floor plane for fun
     */
    this.floor = new FloorPlane( renderer.gl )
    this.lighting.setupMaterial(this.floor.material)
    this.floor.node.setScale(2)
    this.root.add( this.floor.node )
    
  }
  

  preRender():void {
    this.completeLightSetup.preRender()
    
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }


  rttPass():void {
    /**
     * update setup material with the current lightsetup state
     */
    this.lighting.lightSetup.prepare(this.gl);

    /**
     * render ligtmaps for lights which cast shadows
     */
    this.lighting.renderLightmaps( ( ctx:RenderContext )=>{
      // by default ctx.mask is OPAQUE
      // mask can be changed here to render subset of renderabels (eg.  Mask.SHADOW_CASTER)
      this.render(ctx)
    })

  }


  render( context: RenderContext ):void {
    this.completeLightSetup.debugDraw()
    this.floor.render( context )
    this.gltfSample.render( context )
  }

  async load() :Promise<void> {
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
    this.lighting.dispose()
  }

}