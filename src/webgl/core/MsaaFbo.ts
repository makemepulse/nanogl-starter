import { GLContext, isWebgl2 } from "nanogl/types";
import Texture2D from "nanogl/texture-2d";
import Fbo from "nanogl/fbo";
import RenderBuffer from "nanogl/renderbuffer";


export class MsaaFbo {

  readonly gl: GLContext;
  readonly _useMsaa : boolean;

  renderFbo : Fbo;
  blitFbo   : Fbo;


  constructor( gl : GLContext, samples : number, stencil = false ){
    
    this.gl = gl;
    this._useMsaa = isWebgl2(gl) && samples > 1


    this.renderFbo = new Fbo( gl );
    // this.renderFbo.bind();
    
    if( isWebgl2(gl) && this._useMsaa )
    {
      console.log('Msaa available');
      this.renderFbo.attach( gl.COLOR_ATTACHMENT0, new RenderBuffer(gl, gl.RGBA8, samples ) );
      this.renderFbo.attach( gl.DEPTH_ATTACHMENT, new RenderBuffer(gl, gl.DEPTH_COMPONENT24, samples ) );
      this.blitFbo = new Fbo( gl );
      this.blitFbo.attach(gl.COLOR_ATTACHMENT0, new Texture2D(gl, gl.RGBA, gl.UNSIGNED_BYTE));
      this.blitFbo.attach(gl.DEPTH_ATTACHMENT, new RenderBuffer(gl, gl.DEPTH_COMPONENT24 ));
      
      // if(stencil){
        //   this.renderFbo.attach(gl.STENCIL_ATTACHMENT, new RenderBuffer(gl, gl.STENCIL_INDEX8));
      //   this.blitFbo.attach(gl.STENCIL_ATTACHMENT, new RenderBuffer(gl, gl.STENCIL_INDEX8));
      // }
      
      this.blitFbo.getColorTexture(0).setFilter(false, false, false);
      this.renderFbo.resize(4, 4);
      this.blitFbo.resize(4, 4);
    } else 
    {
      console.log('Msaa not available');
      this.renderFbo.attach( gl.COLOR_ATTACHMENT0, new Texture2D( gl, gl.RGBA, gl.UNSIGNED_BYTE) );
      if(stencil){
        this.renderFbo.attach(gl.DEPTH_STENCIL_ATTACHMENT, new RenderBuffer(gl, gl.DEPTH_STENCIL));
      } else {
        this.renderFbo.attach( gl.DEPTH_ATTACHMENT, new RenderBuffer(gl, gl.DEPTH_COMPONENT16 ) );
      }
      this.renderFbo.resize(4, 4);
      this.blitFbo = this.renderFbo;
    }
    
    
  }


  blitMsaa(){
    if( this._useMsaa ) {
      const gl : WebGL2RenderingContext = this.gl as WebGL2RenderingContext;
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.renderFbo.fbo );
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.blitFbo.fbo);
      gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]);
      gl.blitFramebuffer(
        0, 0, this.renderFbo.width, this.renderFbo.height,
        0, 0, this.renderFbo.width, this.renderFbo.height,
        gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, gl.NEAREST
      );
    }
  }


  getColorTexture() : Texture2D {
    return this.blitFbo.getColorTexture();
  }


  setSize( w: number, h: number): void{
    this.renderFbo.resize(w,h);
    this.blitFbo.resize(w,h);
  }

}