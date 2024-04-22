
import { mat4, vec3 } from 'gl-matrix';
import type { RenderContext } from '../../core/RenderContext';
import ColorUtils from '../../utils/Color';
import type { CircleGuizmo } from './CircleGuizmo';
import CircleGuizmos from './CircleGuizmo';


const Orange = ColorUtils.HexToNewVec3( 0xfe9f2c )

/// #if DEBUG




// TEST SWITCH HERE
//*

function m4fromV3( v3:vec3 ) : mat4 {
  const m = mat4.create();
  mat4.fromTranslation( m, v3 );
  return m;
}

class DebugDrawImpl {
  
  _circles: CircleGuizmo[] = [];

  circleRenderer       : CircleGuizmos  
      
  enabled = true


  constructor( device:GPUDevice ){
    this.circleRenderer       = new CircleGuizmos( device )
  }


  clear(){
    this._circles .length = 0
  }

 
  // take vec3 or mat4
  drawCircle( pos : vec3 | mat4, radius = 1, color = Orange ){
    if( !this.enabled ) return
    if( pos.length === 3 ){
      pos = m4fromV3( pos as vec3 );
    }
    this._circles.push( {matrix: pos as mat4, radius, color} );
  }




  render( context: RenderContext ){
    if( !this.enabled ) return

    if( this._circles.length > 0 ) {
      this.circleRenderer.render( context, this._circles );
    }

  }

}


let _instance : DebugDrawImpl;

function init( device:GPUDevice ):void{
  _instance = new DebugDrawImpl( device );
}


const DebugDraw = {
  init,

  get enabled():boolean{
    return _instance.enabled
  },
  set enabled(v:boolean){
    _instance.enabled = v
  },


  drawCircle( pos : vec3 | mat4, radius = 1, color = Orange ){
    _instance.drawCircle( pos, radius, color );
  },
  
  render(context: RenderContext):void{
    _instance.render(context);
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
  drawCone( m : mat4 ):void{0},
  drawSpotLight( l :SpotLight ):void{0},
  drawTexture( name:string, t:Texture2D, flipY = false ):void{0},
  drawText( txt:string, wpos: vec3 ):void{0},
  drawLine( a:vec3, b:vec3, color = Orange ):void{0},
  drawPoint( a:vec3 ):void{0},
  render(ctx:IRenderContext):void{0}
}

export default DebugDraw;

/// #endif
//*/