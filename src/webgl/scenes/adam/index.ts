import { AssetsPath } from "@/core/PublicPath"
import LightmapRenderer from "@webgl/core/LightmapRenderer"
import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import { IGLContextProvider } from "@webgl/resources/IGLContextProvider"
import Node from "nanogl-node"
import DepthPass from "nanogl-pbr/DepthPass"
import Light from "nanogl-pbr/lighting/Light"
import LightType from "nanogl-pbr/lighting/LightType"
import PunctualLight from "nanogl-pbr/lighting/PunctualLight"
import SpotLight from "nanogl-pbr/lighting/SpotLight"
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

  constructor(renderer: Renderer ) {
    this.gl = renderer.gl
    this.root = new Node()
    this.lighting = new Lighting(this.gl)
    this.root.add(this.lighting.root)
    this.gltfSample = new GltfScene(AssetsPath("webgl/adam/Lu_Scene_recorded.gltf"), this.gl, this.lighting, this.root)
  }

  preRender(): void {
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }

  rttPass(): void {
    this.lighting.lightSetup.prepare(this.gl);

    LightmapRenderer.render( this.gl, this.lighting.lightSetup, ( ctx:RenderContext )=>{
      this.gltfSample.render(ctx)
    })

  }

  render(context: RenderContext): void {
    this.gltfSample.render(context)
  }

  async load(): Promise<void> {
    await this.lighting.load()
    await this.gltfSample.load()
    const lights = this.gltfSample.gltf.extras.lights
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



  unload(): void {
    this.lighting.dispose()
  }

}