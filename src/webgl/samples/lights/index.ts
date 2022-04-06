import { AssetsPath } from "@/core/PublicPath"
import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import { IGLContextProvider } from "@webgl/resources/IGLContextProvider"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import SpotLight from "nanogl-pbr/lighting/SpotLight"
import { vec3 } from "gl-matrix"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import gui from "@webgl/dev/gui"

const GltfPath = "webgl/suzanne/Suzanne.gltf"
// const GltfPath = "webgl/fn-509_with_tactical_kit/scene.gltf"
// const GltfPath = "webgl/ground_control_station_for_uav/scene.gltf"

export default class LightsScene implements IGLContextProvider, IScene {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  root       : Node
  spotLight: SpotLight
  
  constructor( renderer:Renderer ){
    this.gl = renderer.gl
    this.root       = new Node()
    this.lighting   = new Lighting( this.gl )
    this.root.add( this.lighting.root )
    this.gltfSample = new GltfScene( AssetsPath(GltfPath), this.gl, this.lighting, this.root )
    

    this.lighting.lightSetup.remove( this.lighting.ibl )
    this.lighting.lightSetup.bounds.fromMinMax( [-10, -10, -10], [10, 10, 10] )

    this.spotLight = new SpotLight()
    
    this.spotLight.position.set([2, 2, 2])
    this.spotLight.lookAt(vec3.create())
    this.spotLight.angle = .5
    this.spotLight._color.set([5, 5, 5])
    this.spotLight.castShadows = true
    
    this.lighting.root.add( this.spotLight )
    this.lighting.lightSetup.add( this.spotLight )
    
    gui.range( this.spotLight, 'z', -5, 10 )
    gui.range( this.spotLight, 'radius', .1, 20 )
    gui.range( this.spotLight, 'angle', .0, Math.PI/2 )
    gui.range( this.spotLight, 'innerAngle', .0, Math.PI/2 )
    gui.add( this.spotLight, 'castShadows')
    
  }
  
  preRender():void {
    this.spotLight.lookAt(vec3.create())

    DebugDraw.drawSpotLight( this.spotLight )
    if(  this.spotLight.castShadows ){
      DebugDraw.drawFrustum( this.spotLight.getCamera()._viewProj )
    }
    
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }

  rttPass():void {
    this.lighting.lightSetup.prepare(this.gl);
    this.lighting.renderLightmaps( ( ctx:RenderContext )=>{
      this.render(ctx)
    })
  }

  render( context: RenderContext ):void {
    this.gltfSample.render( context )
  }

  async load() :Promise<void> {
    await this.lighting.load()
    await this.gltfSample.load()

    /*
     * light setup need scene boundaries to figure out shadowmaps projections
     * needed if shadows are enabled on lights
     */
    this.gltfSample.computeStaticBounds(this.lighting.lightSetup.bounds)
  }

  unload(): void {
    this.lighting.dispose()
  }

}