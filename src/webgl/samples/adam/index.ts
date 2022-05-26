import Quality, { QualityPolicy } from "@webgl/core/Quality"
import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import DepthPass from "nanogl-pbr/DepthPass"
import LightType from "nanogl-pbr/lighting/LightType"
import SpotLight from "nanogl-pbr/lighting/SpotLight"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"




type QualityLevel = {
  enableShadows: boolean,
  shadowmapSize: number,
}

const QualityLevels:QualityLevel[]  = [
  {
    enableShadows: false,
    shadowmapSize: 512,
  },
  {
    enableShadows: true,
    shadowmapSize: 512,
  },
  {
    enableShadows: true,
    shadowmapSize: 1024,
  },
  {
    enableShadows: true,
    shadowmapSize: 2048,
  },
]



export default class AdamScene implements IScene {

  readonly gl: GLContext
  gltfSample: GltfScene
  lighting: Lighting
  root: Node
  depthPass: DepthPass
  quality = new Quality(QualityLevels)
  abortCtrl: AbortController
  mainSpot: SpotLight

  constructor(renderer: Renderer ) {
    this.gl = renderer.gl
    this.root = new Node()
    this.lighting = new Lighting(this.gl)
    this.root.add(this.lighting.root)
    this.gltfSample = new GltfScene("https://mmp-labs.s3.eu-west-1.amazonaws.com/resources/gltfs/adam/Lu_Scene_recorded.gltf", this.gl, this.lighting, this.root, false)
  }

  preRender(): void {
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }

  rttPass(): void {
    this.lighting.lightSetup.prepare(this.gl);
    this.lighting.renderLightmaps( ( ctx:RenderContext )=>{
      this.render(ctx)
    })
  }

  render(context: RenderContext): void {
    this.gltfSample.render(context)
  }

  async load(): Promise<void> {

    this.abortCtrl = new AbortController()
    
    await this.lighting.load()
    await this.gltfSample.load( this.abortCtrl.signal )

    const lights = this.gltfSample.gltf.extras.lights
    for (const l of lights.list) {
      this.lighting.lightSetup.add(l)
    }
    
    this.mainSpot = lights.getLightByName("SpotMain") as SpotLight
    console.assert( this.mainSpot._type === LightType.SPOT ) 
    this.mainSpot.castShadows = true
    

    if (this.gltfSample.gltf.animations[0]) {
      this.gltfSample.playAnimation(this.gltfSample.gltf.animations[0].name)
    }

    this.quality.onChange.on( this.setQuality )
    this.quality.startAutoLevel( this.abortCtrl.signal, QualityPolicy.DEGRADE_CONTINUOUS )
    
  }
  

  setQuality = (level: QualityLevel )=>{
    this.mainSpot.castShadows = level.enableShadows
    this.mainSpot.shadowmapSize = level.shadowmapSize
  }

  
  unload(): void {
    this.quality.onChange.off( this.setQuality )
    this.abortCtrl.abort()
    this.lighting.dispose()
  }

}