
import Guizmo from './CrossGuizmo'
import Frustum from './FrustumGuizmo'
import { vec3, mat4 } from 'gl-matrix';
import IRenderer from '@webgl/core/IRenderer';
import { Gui } from '../gui/decorators';
import Texture2D from 'nanogl/texture-2d';
import TextureDraw, { TextureDrawCommand } from './TextureDraw';



/// #if DEBUG

// TEST SWITCH HERE
//*

function m4fromV3( v3:vec3 ) : mat4 {
  const m = mat4.create();
  mat4.fromTranslation( m, v3 );
  return m;
}


class DebugDrawImpl {
  
  _textures: TextureDrawCommand[];
  _guizmos: mat4[];
  _frustums: mat4[];

  guizmo: Guizmo;
  frustum: Frustum;

  @Gui
  enabled = false
  texDraw: TextureDraw;


  constructor( private renderer:IRenderer ){

    this._textures = [];
    this._guizmos  = [];
    this._frustums = [];

    this.guizmo  = new Guizmo ( renderer )
    this.frustum = new Frustum( renderer )
    this.texDraw = new TextureDraw( renderer )

  }


  clear(){
    this._guizmos.length = 0;
    this._frustums.length = 0;
    this._textures.length = 0; 
  }

  drawTexture( tex:Texture2D, x=0, y=0, w=tex.width, h=tex.height ){

    const vpw = this.renderer.width
    const vph = this.renderer.height

    x /= vpw
    y /= vph
    w /= vpw
    h /= vph

    this._textures.push({
      tex,
      x,y,w,h
    })
  }

  // take vec3 or mat4
  drawGuizmo( x : vec3 | mat4 ){
    
    if( x.length === 3 ){
      this._guizmos.push( m4fromV3( x as vec3 ) );
    } else {
      this._guizmos.push( x as mat4 );
    }
    
    
  }

    // take vec3 or mat4
  drawFrustum( vp : mat4 ){
    
    this._frustums.push( vp );
    
  }

  render(){

    for (let i = 0; i < this._guizmos.length; i++) {
      this.guizmo._wmatrix.set( this._guizmos[i] );
      this.guizmo.render( this.renderer.camera );
    }

    for (let i = 0; i < this._frustums.length; i++) {
      this.frustum.projection = this._frustums[i];
      this.frustum.render( this.renderer.camera );
    }
    
    this.texDraw.prepare()
    for (const cmd of this._textures) {
      this.texDraw.draw( cmd )
      
    }

  }

}


let _instance : DebugDrawImpl;

function init( renderer:IRenderer ):void{
  _instance = new DebugDrawImpl( renderer );
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

  render():void{
    _instance.render();
    _instance.clear();
  }
}

export default DebugDraw;

/*/ 

/// #else

const DebugDraw = {
  enabled:false,
  init():void{0},
  drawGuizmo(x : vec3 | mat4 ):void{0},
  drawFrustum( vp : mat4 ):void{0},
  drawTexture( t:Texture2D, x?:number, y?:number, w?:number, h?:number ):void{0},
  render():void{0}
}

export default DebugDraw;

/// #endif
//*/