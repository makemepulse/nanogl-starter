import DebugDraw from "@webgl/dev/debugDraw/DebugDraw";
import gui from "@webgl/dev/gui";
import Lighting from "@webgl/engine/Lighting";
import { vec3 } from "gl-matrix";
import DirectionalLight from "nanogl-pbr/lighting/DirectionalLight";
import SpotLight from "nanogl-pbr/lighting/SpotLight";
/**
 * Preset lightsetup with all lights types and some gui
 */
export default class CompleteLightSetup {

  spot: SpotLight
  directional: DirectionalLight
  

  debugdraw = true

  private _spotColor = vec3.fromValues(.5, .5, .5)
  private _dirColor = vec3.fromValues(.1, .1, .1)

  constructor( private lighting: Lighting ){
    

    /**
     * add a Spotlight
     */
    this.spot = new SpotLight()
    this.spot.position.set([2, 2, 2])
    this.spot.lookAt(vec3.create())
    this.spot.angle = .5
    this.spot._color.set([5, 5, 5])
    this.spot.castShadows = true
    this.spot.shadowmapSize = 1024

    this.lighting.root.add( this.spot )
    this.lighting.lightSetup.add( this.spot )

    let f = gui.folder('Lighting/Spot' )
    f.add( this, 'debugdraw' )
    f.add( this.spot, 'castShadows' )
    f.range( this.spot, 'z', -5, 10 )
    f.range( this.spot, 'radius', .1, 20 )
    f.range( this.spot, 'angle', .0, Math.PI/2 )
    f.range( this.spot, 'innerAngle', .0, Math.PI/2 )
    f.addColor( this, '_spotColor' )
      .setLabel('color')
      .onChange( (v) => vec3.scale(this.spot._color as vec3, v as vec3, 5) )
      


    /**
     * add a Directional
     */
     this.directional = new DirectionalLight()
     this.directional.position.set([-2, 2, 2])
     this.directional.lookAt(vec3.create())
     this.directional._color.set([.6, .6, .6])
     this.directional.castShadows = true
 
     this.lighting.root.add( this.directional )
     this.lighting.lightSetup.add( this.directional )
 
     f = gui.folder('Lighting/Directional' )
     f.add( this, 'debugdraw' )
     f.add( this.directional, 'castShadows' )
     f.range( this.directional, 'z', -5, 10 )
     f.addColor( this, '_dirColor' )
       .setLabel('color')
       .onChange( (v) => vec3.scale(this.directional._color as vec3, v as vec3, 5) )
       
  }

  preRender() {
    this.spot.lookAt(vec3.create())
  }
  
  debugDraw() {
    /**
     * display spotlight guizmos in the scene
     */
    if( this.debugdraw ){
      DebugDraw.drawText( 'spot', this.spot._wposition )
      DebugDraw.drawSpotLight( this.spot )
      if(  this.spot.castShadows ){
        DebugDraw.drawTexture( 'spot', this.spot.getShadowmap() )
        DebugDraw.drawFrustum( this.spot.getCamera()._viewProj )
      }
      
      DebugDraw.drawText( 'directional', this.directional._wposition )
      DebugDraw.drawGuizmo( this.directional._wmatrix )
      if(  this.directional.castShadows ){
        DebugDraw.drawTexture( 'directional', this.directional.getShadowmap() )
        DebugDraw.drawFrustum( this.directional.getCamera()._viewProj )
      }
    }

  }

}