import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import { GLContext } from "nanogl/types"
import { IScene } from "@webgl/engine/IScene"
import { TextureResource } from "@webgl/resources/TextureResource"
import AssetDatabase from "@webgl/resources/AssetDatabase"
import { TexturedQuad } from "../common/TexturedQuad"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import { mat4, vec3 } from "gl-matrix"

/**
 * load the same texture and test all possible formats jpg, webp, png, pvr, etc, dxt, astc and basis
 */
export default class TexturesAllFormatsSample implements IScene {

  readonly gl : GLContext
  
  textures          : TextureResource[]

  constructor( private renderer:Renderer ){

    const gl = this.gl = renderer.gl

    renderer.cameras.mainCamera.setMatrix(new Float32Array([0.9999935626983643, 1.8080401176234773e-8, -0.003556715091690421, 0, -0.0035530333407223225, 0.04549477621912956, -0.998958170413971, 0, 0.00016179378144443035, 0.9989643692970276, 0.045494481921195984, 0, 4.592252731323242, 14.286325454711914, 0.774425745010376, 1]) as mat4)

    this.textures = [

      new TextureResource( {
        sources:[{
          codec: 'std',
          lods: [{files: [AssetDatabase.getAssetPath("samples/textures/texture1.jpg")]}],
        }]
      }, gl ),

      new TextureResource( {
        sources:[{
          codec: 'webp',
          lods: [{files: [AssetDatabase.getAssetPath("samples/textures/texture1.jpg.webp")]}],
        }]
      }, gl ),

      new TextureResource( {
        sources:[{
          codec: 'pvr',
          lods: [{files: [AssetDatabase.getAssetPath("samples/textures/texture1.jpg.pvr.ktx")]}],
        }]
      }, gl ),

      new TextureResource( {
        sources:[{
          codec: 'etc',
          lods: [{files: [AssetDatabase.getAssetPath("samples/textures/texture1.jpg.etc.ktx")]}],
        }]
      }, gl ),

      new TextureResource( {
        sources:[{
          codec: 'dxt',
          lods: [{files: [AssetDatabase.getAssetPath("samples/textures/texture1.jpg.dxt.ktx")]}],
        }]
      }, gl ),

      new TextureResource( {
        sources:[{
          codec: 'astc',
          lods: [{files: [AssetDatabase.getAssetPath("samples/textures/texture1.jpg.astc.ktx")]}],
        }]
      }, gl ),

      new TextureResource( {
        sources:[{
          codec: 'basis',
          lods: [{files: [AssetDatabase.getAssetPath("samples/textures/texture1.jpg.basis.ktx2")]}],
        }]
      }, gl ),


    ]

  }


  render( context: RenderContext ):void {
    for (let i = 0; i < this.textures.length; i++) {
      const t = this.textures[i];
      DebugDraw.drawText( t.request.sources[0].codec + (t.isLoaded?'':'\nunavailable'), vec3.fromValues( i*1.5, 0, 0.7 ) )
      if( t.isLoaded ){
        TexturedQuad.renderQuad( context, t.texture, i*1.5 )
      }
    }
  }

  load() :Promise<void> {
    return Promise.all( this.textures.map( r=>r.load().catch(()=>{0}))).then()
  }
  
  unload(): void {
    this.textures.forEach(t=>t.unload())
  }

  preRender():void {
    0
  }
  
  rttPass():void {
    0
  }

}