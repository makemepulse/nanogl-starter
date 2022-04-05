import DebugDraw from "@webgl/dev/debugDraw/DebugDraw";
import Renderer from "@webgl/Renderer";
import { TextureSrcSet } from "@webgl/resources/TextureRequest";
import { TextureResource } from "@webgl/resources/TextureResource";
import WebglAssets from "@webgl/resources/WebglAssets";
import { IScene } from "@webgl/engine/IScene";
import { vec3 } from "gl-matrix";
import TestGui from "./testGui";

export default class DevtoolsScene implements IScene {

  textures: TextureResource[]
  ready: boolean;
  texture1: TextureResource;
  texture2: TextureResource;

  testGui: TestGui;


  
  constructor( private renderer:Renderer ){
    const gl = this.renderer.gl
    
    this.textures = []
    this.texture1 = WebglAssets.getTexture( 'texture1', gl )
    this.texture2 = WebglAssets.getTexture( 'texture2', gl )
    
    for (let index = 0; index < 0; index++) {
      const texRes = new TextureResource( new TextureSrcSet( 'https://picsum.photos/512/512' ), {gl} )
      this.textures.push( texRes )
    }
    
  }
  
  
  async load() : Promise<void>{
    
    this.testGui = new TestGui()

    await this.texture1.load()
    await this.texture2.load()
    await Promise.all( this.textures.map( t=>t.load() ) )
    this.ready =true
  }
  
  render(): void {
    
    
    if( ! this.ready ) return
    
    DebugDraw.drawGuizmo( vec3.create() )
    DebugDraw.drawGuizmo( vec3.fromValues(1, 0, 0) )
    
    DebugDraw.drawTexture( this.texture1.value )   
    DebugDraw.drawTexture( this.texture2.value )   
    let x = 0
    for (let i = 0; i < this.textures.length; i++) {
      const tex = this.textures[i].texture;
      DebugDraw.drawTexture( tex, x )   
      x += tex.width
    }
    
    DebugDraw.drawText( 'Hey!?', vec3.fromValues(0, 0, 0) )
    DebugDraw.drawText( 'ABCDEFGHIJKLMNOPQRSTU', vec3.fromValues(0, 1, 0) )
    DebugDraw.drawText( '-_,:()[]%#@', vec3.fromValues(0, 1.5, 0) )

    const t = performance.now()/5000
    const pos = vec3.fromValues(Math.cos(t), 0, Math.sin(t)) 
    DebugDraw.drawText( `[${pos[0].toPrecision(3)}-${pos[1].toPrecision(3)}]`, pos )
  }

  unload(): void {
    this.testGui.dispose()

    this.texture1.unload()
    this.texture2.unload()
    this.textures.map( t=>t.unload() )
  }
  preRender(): void {
    0 
  }
  rttPass(): void {
    0
  }
}