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
import FloorPlane from "@webgl/engine/FloorPlane"

const GltfPath = "webgl/suzanne/Suzanne.gltf"
// const GltfPath = "webgl/fn-509_with_tactical_kit/scene.gltf"
// const GltfPath = "webgl/ground_control_station_for_uav/scene.gltf"

export default class LightsScene implements IGLContextProvider, IScene {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  root       : Node
  spotLight: SpotLight
  floor: FloorPlane
  
  constructor( renderer:Renderer ){
    this.gl = renderer.gl
    this.root       = new Node()
    this.lighting   = new Lighting( this.gl )
    this.root.add( this.lighting.root )
    this.gltfSample = new GltfScene( AssetsPath(GltfPath), this.gl, this.lighting, this.root )

    
    /*
    * add a floor plane for fun
    */
    this.floor = new FloorPlane( renderer.gl )
    this.lighting.setupMaterial(this.floor.material)
    this.floor.node.setScale(2)
    this.root.add( this.floor.node )


    /**
     * remove initial ibl light added by default by Lighting
     */
    this.lighting.lightSetup.remove( this.lighting.ibl )


    /**
     * add a Spotlight
     */
    this.spotLight = new SpotLight()
    this.spotLight.position.set([2, 2, 2])
    this.spotLight.lookAt(vec3.create())
    this.spotLight.angle = .5
    this.spotLight._color.set([5, 5, 5])
    this.spotLight.castShadows = true
    
    this.lighting.root.add( this.spotLight )
    this.lighting.lightSetup.add( this.spotLight )
    
    const f = gui.folder('Lighting/Spot')
    f.range( this.spotLight, 'z', -5, 10 )
    f.range( this.spotLight, 'radius', .1, 20 )
    f.range( this.spotLight, 'angle', .0, Math.PI/2 )
    f.range( this.spotLight, 'innerAngle', .0, Math.PI/2 )
    f.add( this.spotLight, 'castShadows')
    
  }
  

  preRender():void {
    this.spotLight.lookAt(vec3.create())

    /**
     * display spotlight guizmos in the scene
     */
    DebugDraw.drawSpotLight( this.spotLight )
    if(  this.spotLight.castShadows ){
      DebugDraw.drawFrustum( this.spotLight.getCamera()._viewProj )
    }
    
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
    this.gltfSample.computeStaticBounds(this.lighting.lightSetup.bounds)
    this.floor.node.y = this.lighting.lightSetup.bounds.min[1]
  }

  unload(): void {
    this.lighting.dispose()
  }

}