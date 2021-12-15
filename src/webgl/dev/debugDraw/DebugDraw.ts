
import Guizmo from './CrossGuizmo'
import Frustum from './FrustumGuizmo'
import { vec3, mat4 } from 'gl-matrix';
import { Gui, GuiFolder } from '../gui/decorators';
import Texture2D from 'nanogl/texture-2d';
import TextureDraw, { TextureDrawCommand } from './TextureDraw';
import TextRenderer from './Text';
import Grid, { GridOrientation } from './Grid';
import { GLContext } from 'nanogl/types';
import { RenderContext } from '@webgl/core/Renderer';



/// #if DEBUG

// TEST SWITCH HERE
//*

function m4fromV3( v3:vec3 ) : mat4 {
  const m = mat4.create();
  mat4.fromTranslation( m, v3 );
  return m;
}

@GuiFolder("DebugDraw")
class DebugDrawImpl {
  
  _textures: TextureDrawCommand[];
  _guizmos: mat4[];
  _frustums: mat4[];

  guizmo: Guizmo;
  frustum: Frustum;
  texDraw: TextureDraw;
  textRenderer: TextRenderer;
  grid : Grid

  @Gui
  enabled = true

  @Gui
  gridXZ = true

  @Gui
  gridXY = false

  @Gui
  gridZY = false



  constructor( private gl:GLContext ){

    this._textures = [];
    this._guizmos  = [];
    this._frustums = [];

    this.guizmo       = new Guizmo      ( gl )
    this.frustum      = new Frustum     ( gl )
    this.texDraw      = new TextureDraw ( gl )
    this.textRenderer = new TextRenderer( gl )
    this.grid         = new Grid        ( gl )

  }


  clear(){
    this._guizmos.length = 0;
    this._frustums.length = 0;
    this._textures.length = 0; 
    this.textRenderer.clear()
  }

  drawTexture( tex:Texture2D, x=0, y=0, w=tex.width, h=tex.height ){
    if( !this.enabled ) return

    this._textures.push({
      tex,
      x,y,w,h
    })
  }

  // take vec3 or mat4
  drawGuizmo( x : vec3 | mat4 ){
    if( !this.enabled ) return
    if( x.length === 3 ){
      this._guizmos.push( m4fromV3( x as vec3 ) );
    } else {
      this._guizmos.push( x as mat4 );
    }
  }

    // take vec3 or mat4
  drawFrustum( vp : mat4 ){
    if( !this.enabled ) return
    this._frustums.push( vp );
  }

  drawText( txt:string, wpos: vec3 ):void{
    if( !this.enabled ) return
    this.textRenderer.add( txt, wpos)
  }

  render( ctx:RenderContext ){
    if( !this.enabled ) return

    this.grid.draw( 
      (this.gridXZ ? GridOrientation.XZ : 0) |
      (this.gridXY ? GridOrientation.XY : 0) |
      (this.gridZY ? GridOrientation.YZ : 0) 
      , ctx
    )

    for (let i = 0; i < this._guizmos.length; i++) {
      this.guizmo._wmatrix.set( this._guizmos[i] );
      this.guizmo.render( ctx.camera );
    }

    for (let i = 0; i < this._frustums.length; i++) {
      this.frustum.projection = this._frustums[i];
      this.frustum.render( ctx.camera );
    }
    
    this.texDraw.prepare()
    for (const cmd of this._textures) {
      this.texDraw.draw( cmd, ctx )
    }

    this.textRenderer.draw(ctx)

  }

}


let _instance : DebugDrawImpl;

function init( gl:GLContext ):void{
  _instance = new DebugDrawImpl( gl );
}


const DebugDraw = {
  init,

  get enabled():boolean{
    return _instance.enabled
  },


  set enabled(v:boolean){
    _instance.enabled = v
  },

  drawGuizmo(x : vec3 | mat4 ):void{
    _instance.drawGuizmo(x);
  },
  
  
  drawFrustum( vp : mat4 ):void{
    _instance.drawFrustum( vp );
  },

  drawTexture( t:Texture2D, x?:number, y?:number, w?:number, h?:number ):void{
    _instance.drawTexture(t, x, y, w, h );
  },

  drawText( txt:string, wpos: vec3 ):void{
    _instance.drawText( txt, wpos );
  },

  render(ctx:RenderContext):void{
    _instance.render(ctx);
    _instance.clear();
  }

}

export default DebugDraw;

/*/ 

/// #else

const DebugDraw = {
  enabled:false,
  init(gl:GLContext):void{0},
  drawGuizmo(x : vec3 | mat4 ):void{0},
  drawFrustum( vp : mat4 ):void{0},
  drawTexture( t:Texture2D, x?:number, y?:number, w?:number, h?:number ):void{0},
  drawText( txt:string, wpos: vec3 ):void{0},
  render(ctx:IRenderContext):void{0}
}

export default DebugDraw;

/// #endif
//*/