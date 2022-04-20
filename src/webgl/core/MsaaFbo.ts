import { GLContext, isWebgl2 } from "nanogl/types";
import Texture2D from "nanogl/texture-2d";
import Fbo from "nanogl/fbo";
import RenderBuffer from "nanogl/renderbuffer";


export class MsaaFbo {

  msaaFbo : Fbo = null
  blitFbo : Fbo = null
  
  
  private _msaa = 1;
  private _maxMsaa = 1;
  private _width  = 4
  private _height = 4

 
  set msaa( samples:number ) {
    if( this._msaa !== samples){
      this._msaa = Math.min(samples, this._maxMsaa)
      this._allocate()
    }
  }

  get msaa():number {
    return this._msaa;
  }


  constructor( readonly gl : GLContext, readonly _alpha = false, samples = 4, readonly _depth = true, readonly _stencil = false ){
    this._maxMsaa = isWebgl2(gl) ? gl.getParameter( gl.MAX_SAMPLES ):0
    this.msaa = samples    
  }

 

  _allocate(){
    
    const gl = this.gl
    
    if( isWebgl2(gl) && this._msaa > 0 && this.msaaFbo === null  )
    {
      this.msaaFbo = new Fbo( gl );
      this.msaaFbo.attach( gl.COLOR_ATTACHMENT0, new RenderBuffer(gl, this._alpha? gl.RGBA8 : gl.RGB8, this._msaa ) );
      if( this._depth ){
        this.msaaFbo.attach( gl.DEPTH_ATTACHMENT, new RenderBuffer(gl, gl.DEPTH_COMPONENT24, this._msaa ) );
      }

      
      this.msaaFbo.resize(this._width, this._height);
    } 

    if( this._msaa < 1){
      this.msaaFbo?.dispose()
      this.msaaFbo = null
    }

    if( this.blitFbo === null )
    {

      this.blitFbo = new Fbo( gl );
      this.blitFbo.attach(gl.COLOR_ATTACHMENT0, new Texture2D(gl, this._alpha? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE));
      if( this._depth || this._stencil ){
        this.blitFbo.attach( gl.DEPTH_ATTACHMENT, new RenderBuffer(gl, isWebgl2(gl)?gl.DEPTH_COMPONENT24:gl.DEPTH_COMPONENT16 ) );
      }

      
      this.blitFbo.getColorTexture(0).setFilter(false, false, false);
      this.blitFbo.resize(this._width, this._height);
    }
    
  }


  get renderFbo(){
    return this.msaaFbo ?? this.blitFbo
  }

  blitMsaa(){
    if( this.msaaFbo ) {
      const gl : WebGL2RenderingContext = this.gl as WebGL2RenderingContext;
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaaFbo.fbo );
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.blitFbo.fbo);
      gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]);
      let bits = gl.COLOR_BUFFER_BIT
      if( this._depth ) bits = bits | gl.DEPTH_BUFFER_BIT
      gl.blitFramebuffer(
        0, 0, this.msaaFbo.width, this.msaaFbo.height,
        0, 0, this.msaaFbo.width, this.msaaFbo.height,
        bits, gl.NEAREST
      );
    }
  }


  getColorTexture() : Texture2D {
    return this.blitFbo.getColorTexture();
  }


  setSize( w: number, h: number): void{
    this._width = w
    this._height = h
    this.msaaFbo?.resize(w,h);
    this.blitFbo.resize(w,h);
  }

}