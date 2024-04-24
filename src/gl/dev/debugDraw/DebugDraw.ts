
import { mat4, vec3 } from 'gl-matrix';
import type { RenderContext } from '../../core/RenderContext';
import ColorUtils from '../../utils/Color';
import CircleGuizmos from './CircleGuizmo';
import CrossGuizmos from './CrossGuizmo';
import Grid, { GridOrientation } from './Grid';
import Lines from './Lines';


const OrangeHex = 0xfe9f2c
const Orange = ColorUtils.HexToNewVec3( OrangeHex )

/// #if DEBUG




// TEST SWITCH HERE
//*

function m4fromV3( v3:vec3|mat4 ) : mat4 {
  if( v3.length === 3 ){
    const m = mat4.create();
    mat4.fromTranslation( m, v3 as vec3 );
    return m;
  }
  return v3 as mat4;
}

class DebugDrawImpl {
  
  circleRenderer       : CircleGuizmos  
  guizmoRenderer       : CrossGuizmos
  grid : Grid;
  lineRenderer : Lines
      
  enabled = true
  gridXZ = true
  gridXY = false
  gridZY = false

  constructor( device:GPUDevice ){
    this.circleRenderer = new CircleGuizmos( device )
    this.guizmoRenderer = new CrossGuizmos ( device )
    this.grid           = new Grid         ( device )
    this.lineRenderer   = new Lines        ( device )
  }


  clear(){
    this.circleRenderer.clear()
    this.guizmoRenderer.clear()
    this.lineRenderer.clear()
  }

 
  drawCircle( pos : vec3 | mat4, radius = 1, color = Orange ){
    if( !this.enabled ) return
    this.circleRenderer.add( m4fromV3(pos), radius, color );
  }

  drawGuizmo( pos : vec3 | mat4 ){
    if( !this.enabled ) return
    this.guizmoRenderer.add( m4fromV3(pos) );
  }

  drawLine( a:vec3, b:vec3, color = OrangeHex ){
    if( !this.enabled ) return
    this.lineRenderer.addLine( a, b, color );
  }



  render( context: RenderContext ){
    if( !this.enabled ) return

    this.grid.render( 
      (this.gridXZ ? GridOrientation.XZ : 0) |
      (this.gridXY ? GridOrientation.XY : 0) |
      (this.gridZY ? GridOrientation.YZ : 0) 
      , context
    )

    this.circleRenderer.render( context );
    this.guizmoRenderer.render( context );
    this.lineRenderer  .render( context );

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
  
  drawGuizmo( pos : vec3 | mat4 ){
    _instance.drawGuizmo( pos );
  },

  drawLine( a:vec3, b:vec3, color = OrangeHex ){
    _instance.drawLine( a, b, color );
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