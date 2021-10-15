import IRenderer from "@webgl/core/IRenderer";
import { GLContext } from "nanogl/types";
import Rect from 'nanogl-primitives-2d/rect'
import Program from "nanogl/program";
import Texture2D from "nanogl/texture-2d";
import { LocalConfig } from "nanogl-state";

const VERT = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord0;
uniform vec4 uScaleTranslate;
void main( void ){
  gl_Position = vec4( aPosition*uScaleTranslate.xy+uScaleTranslate.zw, 0.0, 1.0 );
  gl_Position.y *= -1.0;
  vTexCoord0 = aTexCoord;
}
`


const FRAG = `
precision lowp float;
varying vec2 vTexCoord0;
uniform sampler2D tTex;
void main(void){
  gl_FragColor = texture2D( tTex, vTexCoord0 );
}
`


export type TextureDrawCommand = {

  tex : Texture2D
  x:number
  y:number
  w:number
  h:number,
  flipY? :boolean
}


export default class TextureDraw {

  gl: GLContext;
  rect : Rect
  prg: Program;
  cfg: LocalConfig;

  constructor( renderer : IRenderer ){

    this.gl = renderer.gl
    const gl = this.gl

    this.prg = new Program(gl, VERT, FRAG);

    this.cfg = renderer.glstate.config()
      .enableCullface(false)
      .enableDepthTest(false)
      .depthMask(false)
      
    this.rect = new Rect( gl )
    this.rect.attribPointer( this.prg )
  }
  
  prepare():void{
    this.prg.use()
    this.rect.attribPointer( this.prg )
    this.cfg.apply()
  }
  
  draw( command: TextureDrawCommand ):void{
    const {x,y,w,h} = command
    this.prg.tTex( command.tex )
    this.prg.uScaleTranslate( w, h, (x*2)-1+w, (y*2)-1+h)
    // this.prg.uScaleTranslate( 1, 1, 0, 0 )
    this.rect.render()
  }

}