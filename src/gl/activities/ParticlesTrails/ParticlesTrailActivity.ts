import { vec3, type mat4 } from "gl-matrix";
import Camera from "nanogl-camera";
import type PerspectiveLens from "nanogl-camera/perspective-lens";
import type Engine from "../../Engine";
import DevCameraController from "../../cameras/DevCameraController";
import { BaseActivity } from "../../core/Activity";
import Time from "../../core/Time";
import Plane from "../../math/Plane";
import Ray from "../../math/Ray";
import rayPlaneIntersection from "../../math/rayPlaneIntersection";
import Renderer from "../../renderer/Renderer";
import { RendererCanvasTarget, RendererTarget } from "../../renderer/RendererTarget";
import TexturedQuadRenderable from "../TexturedQuadRenderable";
import CatmullCurve from "./CatmullCurve";
import Trail from "./Trail";
import CurveDrawer from "./CurveDrawer";
import GpuCurves, { type CurveBehaviour } from "./GpuCurves";
import CurveCursorsSource from "./CurveCursorsSource";
import CurvePaintBehaviour from "./CurvePaintBehaviour";
import CurveTeleportBehaviour from "./CurveTeleportBehaviour";
import CurveTeleportBehaviour2 from "./CurveTeleportBehaviour2";

const V3_1 = vec3.create()
const V3_2 = vec3.create()

const PROJ_PLANE = new Plane( )
PROJ_PLANE.normal.set( [0,0,1] )

const RAY = new Ray()


enum BehaviourType {
  PAINT,
  TELEPORT,
  TELEPORT2
}
const expe : BehaviourType = BehaviourType.PAINT 

export default class ParticlesTrailActivity extends BaseActivity {


  bindGroup?: GPUBindGroup;
  quad: TexturedQuadRenderable;

  camera: Camera<PerspectiveLens>
  camCtrl: DevCameraController;
  rendererTarget: RendererTarget;
  renderer: Renderer;
  curve: CatmullCurve;
  trail: Trail;
  drawer: CurveDrawer

  gpuCurves: GpuCurves;
  behaviour: CurveBehaviour;

  constructor(engine: Engine) {
    super(engine)
    this.quad = new TexturedQuadRenderable(engine.device);

    this.quad.node.z = 1

    this.camera = Camera.makePerspectiveCamera()
    this.camera.setMatrix(new Float32Array([0.9428232908248901,4.116017748856393e-9,-0.33329305052757263,0,-0.17730146646499634,0.8467640280723572,-0.5015524625778198,0,0.2822205722332001,0.5319686532020569,0.7983488440513611,0,1.360023021697998,2.610576868057251,3.865023374557495,1]) as mat4)
    this.camera.lens.near = 0.1
    this.camera.lens.far = 50.0
    this.camCtrl = new DevCameraController(engine.canvasTarget.canvas)
    this.camCtrl.start(this.camera)

    this.curve = new CatmullCurve(engine.device)
    this.drawer = new CurveDrawer(this.curve)

    this.rendererTarget = new RendererCanvasTarget( this.engine.canvasTarget )
    this.renderer = new Renderer( engine.device, this.rendererTarget, this.camera )

    this.trail = new Trail( engine.device, this.curve )
    // this.renderer.addRenderable( this.trail )
    
    this.gpuCurves = new GpuCurves( engine.device, 128, 256, 0.1)

    if( expe === BehaviourType.PAINT ){
      this.behaviour = new CurvePaintBehaviour( engine.device, this.gpuCurves )
    }
    
    if( expe === BehaviourType.TELEPORT ){
      this.behaviour = new CurveTeleportBehaviour( engine.device, this.gpuCurves )
    }

    this.behaviour = new CurveTeleportBehaviour2( engine.device, this.gpuCurves )
    
    this.gpuCurves.setCurveBehaviour( this.behaviour )

    this.renderer.addRenderable( this.gpuCurves )
  }

  raycastMouseEvent( e: MouseEvent, out: vec3 ){
    const x = e.clientX / window.innerWidth
    const y = e.clientY / window.innerHeight

    RAY.unproject( [x*2-1, -y*2+1], this.camera );
    rayPlaneIntersection( out, RAY, PROJ_PLANE );

    return out
  }

  onClick = (e: MouseEvent) => {
    this.raycastMouseEvent(e, V3_1);
    // (this.behaviour as CurveTeleportBehaviour).init(V3_1)
  }

  onMouseMove = (e: MouseEvent) => {
    this.raycastMouseEvent(e, V3_1);
    (this.behaviour as CurvePaintBehaviour).update(V3_1)
  }

  start(): void {
    document.addEventListener( 'mousemove',this.onMouseMove )
    document.addEventListener( 'click',this.onClick )
  }

  stop(): void {
    document.removeEventListener( 'mousemove',this.onMouseMove )
    document.removeEventListener( 'click',this.onClick )
  }


  render(): void {
    
    this.camCtrl.update(Time.dt)
    
    // for (let i = 1; i < this.curve.numAnchors; i++) {
    //   this.curve.getAnchor(i-1, V3_1)
    //   this.curve.getAnchor(i, V3_2)
    //   this.renderer.debugDraw.d rawLine( V3_1, V3_2, 0x00ff00 )
    // }

    this.renderer.render()
  }

}