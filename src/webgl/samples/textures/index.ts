import { AssetsPath } from "@/core/PublicPath"
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


class TextureSample {
  
  plane: FloorPlane
  unlitPass: UnlitPass
  
  constructor( gl : GLContext ) {
    this.plane = new FloorPlane( gl )
    this.unlitPass = new UnlitPass()
    this.unlitPass.glconfig
      .enableDepthTest()
    this.plane.material.addPass( this.unlitPass )
  }

  setTexture(t:Texture2D ){
    this.unlitPass.baseColor.attachSampler( "color", TexCoord.create('aTexCoord')).set(t)
  }

  render(context: RenderContext) {
    this.plane.render(context)
  }

}

export default class TexturesScene implements IGLContextProvider, IScene {

  readonly gl : GLContext
  root       : Node
  planes : TextureSample[] = []
  
  constructor( renderer:Renderer ){
    this.gl = renderer.gl
    this.root       = new Node()

    for (let i = 0; i < 2; i++) {
      const s = new TextureSample( renderer.gl )
      this.planes.push( s )
      s.plane.node.x = i*1.2
      s.plane.node.y = .1
      s.plane.node.setScale(.5)
      this.root.add( s.plane.node )
    }

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
      new TextureResource(AssetsPath("/webgl/suzanne/Suzanne_BaseColor.png"), this ),
      WebglAssets.getTexture( 'texture1', this.gl ),
    ]

    
    tlist.map( r=>r.load() )
    
    for (let i = 0; i < tlist.length; i++) {
      const t = tlist[i];
      this.planes[i].setTexture( t.texture )
    }

  
  }

  unload(): void {
    0
  }

}