import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { IScene } from "@webgl/engine/IScene"
import { TextureResource } from "@webgl/resources/TextureResource"
import AssetDatabase from "@webgl/resources/AssetDatabase"
import Delay from "@/core/Delay"
import gui from "@webgl/dev/gui"
import { TexturedQuad } from "../common/TexturedQuad"


export default class TexturesSample implements IScene {

  readonly gl : GLContext
  
  root              : Node
  planes            : TexturedQuad  [] = []
  textures          : TextureResource[]
  lodTex: TextureResource

  _loaded = false

  
  constructor( private renderer:Renderer ){

    const gl = this.gl = renderer.gl
    this.root       = new Node()

    this.textures = [


      /*
       * simple TextureResource loaded from string url
       */
      new TextureResource( AssetDatabase.getAssetPath("gltfs/suzanne/Suzanne_BaseColor.png"), gl ),

      /*
       * manually create a LODed texture resource
       */
      this.lodTex = new TextureResource( {
        sources:[
          {
            codec: 'std',
            lods: [
              {files: [AssetDatabase.getAssetPath("sample/avatar_LOD0.png")]},
              {files: [AssetDatabase.getAssetPath("sample/avatar_LOD1.png")]},
              {files: [AssetDatabase.getAssetPath("sample/avatar_LOD2.png")]},
            ],
          }
        ]
      }, gl ),



      // all textures created from AssetDatabase.getTexture() automatically benefit from hmr / hot reload
      // this should load compressed texture 
      AssetDatabase.getTexture( 'texture1', gl ),


      // with some options 
      AssetDatabase.getTexture( 'avatar', gl, {
        alpha: true,
        smooth: false,
      } ),
      
      // other way to set options on loaded texture
      AssetDatabase.getTexture( 'avatar', gl ).setTransparent().clamp().setFilter( true, false, false ),


      // example with all options available
      AssetDatabase.getTexture( 'matcap_white', gl, {
        smooth: true,
        mipmap: true, 
        miplinear: true,
        wrap: 'mirror',
        aniso: 16,
        alpha: false,
      } ),

      
      // texture from external url with options
      // new TextureResource( 'https://picsum.photos/128/128', gl ),
      new TextureResource( require('@/assets/webgl/sample/avatar_LOD1.png').default, gl ),

    ]

    // stress test to validate unload effectivness
    // for (let i = 0; i < 50; i++) {
    //   this.textures.push(new TextureResource(AssetDatabase.getAssetPath("gltfs/suzanne/Suzanne_BaseColor.png"), this.gl ))
    // }


    for (let i = 0; i < this.textures.length; i++) {
      const t = this.textures[i];

      const s = new TexturedQuad( this.renderer.gl )
      this.planes.push( s )
      s.plane.node.x = i*1.2
      s.plane.node.y = .1
      s.plane.node.setScale(.5)
      this.root.add( s.plane.node )
      s.setTexture( t.texture )
    }

    this.lodTex.lodLevel = 2
    this.startLodSequence()


    const f = gui.folder('Textures Sample')
    f.btn('unload all', ()=>this.unloadTextures() )
    f.btn('load all', ()=>this.load() )

  }

  async startLodSequence(){
    await Delay(1000)
    this.lodTex.lodLevel--
    await Delay(1000)
    this.lodTex.lodLevel--
  }

  /**
   * unload all texture resources
   */
  unloadTextures(){
    this._loaded = false
    this.textures.forEach(t=>t.unload())
  }

  preRender():void {
    this.root.updateWorldMatrix()
  }

  rttPass():void {
    0
  }

  render( context: RenderContext ):void {
    this.planes.forEach( p => p.render( context ) )
  }

  load() :Promise<void> {
    return Promise.all( this.textures.map( r=>r.load() ) )
      .then( ()=>{this._loaded = true} )
  }

  unload(): void {
    0
  }

}