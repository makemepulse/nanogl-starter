
import { mat4, vec3 } from 'gl-matrix';



/// #if DEBUG


import type { RenderContext } from '../../renderer/RenderContext';
import AxisRenderer from './AxisRenderer';
import CircleRenderer from './CircleRenderer';
import ConeRenderer from './ConeRenderer';
import GridRenderer, { GridOrientation } from './GridRenderer';
import LineRenderer from './LineRenderer';

const DefaultColorHex = 0xfe9f2c

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

export class DebugDrawImpl {
  
  circleRenderer : CircleRenderer
  axisRenderer   : AxisRenderer
  gridRenderer   : GridRenderer
  lineRenderer   : LineRenderer
  coneRenderer   : ConeRenderer
      
  enabled = true
  gridXZ = true
  gridXY = false
  gridZY = false

  constructor( device:GPUDevice ){
    this.circleRenderer = new CircleRenderer ( device )
    this.axisRenderer   = new AxisRenderer   ( device )
    this.gridRenderer   = new GridRenderer   ( device )
    this.lineRenderer   = new LineRenderer   ( device )
    this.coneRenderer   = new ConeRenderer   ( this )
  }


  clear(){
    this.circleRenderer.clear()
    this.axisRenderer.clear()
    this.lineRenderer.clear()
  }

 
  drawCircle( pos : vec3 | mat4, radius = 1, colorHexRgb = DefaultColorHex ){
    if( !this.enabled ) return
    this.circleRenderer.add( m4fromV3(pos), radius, colorHexRgb );
  }

  drawAxis( pos : vec3 | mat4 ){
    if( !this.enabled ) return
    this.axisRenderer.add( m4fromV3(pos) );
  }

  drawLine( a:vec3, b:vec3, colorHexRgb = DefaultColorHex ){
    if( !this.enabled ) return
    this.lineRenderer.addLine( a, b, colorHexRgb );
  }
  
  drawCone( m : mat4, height: number, angle: number, colorHexRgb = DefaultColorHex, segs?:number ){
    if( !this.enabled ) return
    this.coneRenderer.addCone( m, height, angle, colorHexRgb, segs );
  }



  render( context: RenderContext ){
    if( !this.enabled ) return
    this.circleRenderer.render( context );
    this.axisRenderer.render( context );
    this.lineRenderer  .render( context );

    this.gridRenderer.render( 
      (this.gridXZ ? GridOrientation.XZ : 0) |
      (this.gridXY ? GridOrientation.XY : 0) |
      (this.gridZY ? GridOrientation.YZ : 0) 
      , context
    )


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


  drawCircle( pos : vec3 | mat4, radius = 1, color = DefaultColorHex ){
    _instance.drawCircle( pos, radius, color );
  },
  
  drawAxis( pos : vec3 | mat4 ){
    _instance.drawAxis( pos );
  },

  drawLine( a:vec3, b:vec3, color = DefaultColorHex ){
    _instance.drawLine( a, b, color );
  },

  drawCone( m : mat4, height: number, angle: number, color = DefaultColorHex, segs?:number  ){
    _instance.drawCone( m, height, angle, color, segs );
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