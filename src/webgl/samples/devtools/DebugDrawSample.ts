import DebugDraw from "@webgl/dev/debugDraw/DebugDraw";
import Renderer from "@webgl/Renderer";
import { TextureResource } from "@webgl/resources/TextureResource";
import AssetDatabase from "@webgl/resources/AssetDatabase";
import { IScene } from "@webgl/engine/IScene";
import { mat4, vec3 } from "gl-matrix";
import MatrixUtils from "@webgl/math/MatrixUtils";

const ZERO = vec3.create();
const V3   = vec3.create();

const M4 = mat4.create();
mat4.translate( M4, M4, vec3.fromValues(2.6, 0, .1) );

export default class DebugDrawSample implements IScene {

  ready: boolean;
  texture1: TextureResource;
  texture2: TextureResource;

  constructor( private renderer:Renderer ){
    const gl = this.renderer.gl
    
    this.texture1 = AssetDatabase.getTexture( 'texture1', gl )
    this.texture2 = AssetDatabase.getTexture( 'texture2', gl )
    
  }
  
  
  async load() : Promise<void>{
    await this.texture1.load()
    await this.texture2.load()
  }
  
  render(): void {
    
    DebugDraw.drawPoint( ZERO )

    DebugDraw.drawTexture( 'tex1', this.texture1.texture )
    DebugDraw.drawTexture( 'tex2', this.texture2.texture )
    
    DebugDraw.drawText( 'Origin', vec3.fromValues(0, 0, 0) )
    DebugDraw.drawText( 'ABCDEFGHIJKLMNOPQRSTU', vec3.fromValues(0, 1, 0) )
    DebugDraw.drawText( '-_,:()[]%#@', vec3.fromValues(0, 1.5, 0) )
    DebugDraw.drawText( 'text \non \nmultiple \nlines', vec3.fromValues(0, 2, 0) )
    
    const t = performance.now()/5000
    const pos = vec3.fromValues(Math.cos(t), 0, Math.sin(t))
    DebugDraw.drawText( `[${pos[0].toPrecision(3)}-${pos[1].toPrecision(3)}]`, pos )
    
    DebugDraw.drawPoint( pos )
    
    
    DebugDraw.drawText( 'drawLine()', vec3.scaleAndAdd(vec3.create(), ZERO, pos, .5) )
    DebugDraw.drawLine( ZERO, pos )
    
    
    
    
    DebugDraw.drawText( 'drawGuizmo( vec3 )', vec3.fromValues(1.4, 0, 0.2) )
    DebugDraw.drawGuizmo( vec3.fromValues(1.4, 0, 0.1) )
    

    mat4.rotateX( M4, M4, .001 )
    mat4.rotateY( M4, M4, .0008 )
    mat4.rotateZ( M4, M4, .0007 )
    
    DebugDraw.drawText( 'drawGuizmo( mat4 )', MatrixUtils.getOrigin(V3, M4) )
    DebugDraw.drawGuizmo( M4 )
    
  }

  unload(): void {
    this.texture1.unload()
    this.texture2.unload()
  }
  

  preRender(): void {0}
  rttPass(): void {0}
}