import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import { IGLContextProvider } from "@webgl/resources/IGLContextProvider"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { IScene } from "@webgl/engine/IScene"
import FloorPlane from "@webgl/engine/FloorPlane"
import UnlitPass from "nanogl-pbr/UnlitPass"
import Texture2D from "nanogl/texture-2d"
import { TextureResource } from "@webgl/resources/TextureResource"
import WebglAssets from "@webgl/resources/WebglAssets"
import TexCoord from "nanogl-pbr/TexCoord"
import { Sampler } from "nanogl-pbr/Input"


class TextureSample {
  
  plane: FloorPlane
  unlitPass: UnlitPass
  
  constructor( gl : GLContext ) {
    this.plane = new FloorPlane( gl )
    this.unlitPass = new UnlitPass()
    this.unlitPass.glconfig
      .enableDepthTest()
      .enableBlend()
      .blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA )
    this.unlitPass.alphaMode.set("BLEND")

    this.plane.material.addPass( this.unlitPass )
  }

  setTexture(t:Texture2D ){
    const sampler = new Sampler('color', TexCoord.create('aTexCoord') )
    sampler.set( t )
    this.unlitPass.baseColor.attach( sampler, 'rgb' )
    this.unlitPass.alpha.attach( sampler, 'a' )
  }

  render(context: RenderContext) {
    this.plane.render(context)
  }

}

export default class TexturesScene implements IGLContextProvider, IScene {

  readonly gl : GLContext
  root       : Node
  planes : TextureSample[] = []
  matcap: TextureResource
  avatarOpaque: TextureResource
  avatarTransparent: TextureResource
  
  constructor( private renderer:Renderer ){
    this.gl = renderer.gl
    this.root       = new Node()



    this.matcap = WebglAssets.getTexture( 'matcap_white', this.gl, {
      smooth: true,
      mipmap: true, 
      miplinear: true,
      wrap: 'mirror',
      aniso: 16
    } )

    this.avatarOpaque = WebglAssets.getTexture( 'avatar', this.gl )
    
    this.avatarTransparent = WebglAssets.getTexture( 'avatar', this.gl, {
      alpha: true,
      smooth: false,
    } )
    


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

  async load() :Promise<void> {
    
    const tlist = [
      new TextureResource(WebglAssets.getAssetPath("gltfs/suzanne/Suzanne_BaseColor.png"), this ),
      WebglAssets.getTexture( 'texture1', this.gl ),
      this.matcap,
      this.avatarOpaque,
      this.avatarTransparent,
    ]

    
    const promises = tlist.map( r=>r.load() )
    
    for (let i = 0; i < tlist.length; i++) {
      const t = tlist[i];

      const s = new TextureSample( this.renderer.gl )
      this.planes.push( s )
      s.plane.node.x = i*1.2
      s.plane.node.y = .1
      s.plane.node.setScale(.5)
      this.root.add( s.plane.node )
      s.setTexture( t.texture )
    }

    await Promise.all( promises )

  }

  unload(): void {
    0
  }

}