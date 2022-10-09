import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import Dome from "./Dome"
import Bounds from "nanogl-pbr/Bounds"
import ShadowCatcher from "../shadow_catcher/ShadowCatcher"

// import Suzanne from "@/assets/webgl/samples/suzanne/suzanne.gltf"

// const GltfPath = "samples/suzanne/suzanne.gltf"
const GltfPath = "samples/suzanne/suzanne.gltf"
// const GltfPath = "webgl/fn-509_with_tactical_kit/scene.gltf"
// const GltfPath = "webgl/ground_control_station_for_uav/scene.gltf"
// const GltfPath = "webgl/meetmats/vzla/scene.gltf"
// const GltfPath = "webgl/meetmats/lava/scene.gltf"
// const GltfPath = "webgl/meetmats/deadpool/scene.gltf"
// const GltfPath = "webgl/meetmats/astronaut/scene.gltf"
// const GltfPath = "webgl/chevy_bolt/CarScene.gltf"

export default class PackshotSample implements IScene {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  dome: Dome
  shadowcatcher: ShadowCatcher
  
  constructor( renderer:Renderer ){
    this.gl = renderer.gl
    this.lighting   = new Lighting( this.gl )
    this.gltfSample = new GltfScene( GltfPath, this.gl, this.lighting )
    this.dome = new Dome( this.gl, this.lighting.ibl )
    this.shadowcatcher = new ShadowCatcher( this.gl)
  }

  preRender():void {
    this.gltfSample.preRender()
    this.lighting.root.updateWorldMatrix()
    this.shadowcatcher.updateWorldMatrix()
  }

  rttPass():void {
    this.lighting.lightSetup.prepare(this.gl);
    this.shadowcatcher.renderShadowmap( ( ctx:RenderContext )=>{
      this.render(ctx)
    })
  }

  render( context: RenderContext ):void {
    this.gltfSample   .render( context )
    this.dome         .render( context )
    this.shadowcatcher.render( context )
  }

  load() :Promise<void> {
    return Promise.all([
      this.lighting.load(),
      this.gltfSample.load(),
    ]).then( this.onLoaded)
  }

  onLoaded = () => {
    
    const gltfBounds = new Bounds()
    this.gltfSample.computeStaticBounds(gltfBounds)
    this.gltfSample.gltf.root.y = -gltfBounds.min[1]
    this.gltfSample.gltf.root.updateWorldMatrix()

  }

  unload(): void {
    this.lighting.dispose()
    this.shadowcatcher.dispose()
    this.gltfSample.unload()
  }

}