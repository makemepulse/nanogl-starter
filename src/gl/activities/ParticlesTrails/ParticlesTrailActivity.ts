import Camera from "nanogl-camera";
import type PerspectiveLens from "nanogl-camera/perspective-lens";
import type Engine from "../../Engine";
import DevCameraController from "../../cameras/DevCameraController";
import { BaseActivity } from "../../core/Activity";
import { BindGroup, CameraBindGroupFactory } from "../../core/BindGroup";
import Time from "../../core/Time";
import RenderPass from "../../renderer/RenderPass";
import type { RenderViewContext } from "../../renderer/RenderViewContext";
import Renderer from "../../renderer/Renderer";
import { RendererTarget } from "../../renderer/RendererTarget";
import TexturedQuadRenderable from "../TexturedQuadRenderable";
import CatmullCurve from "./CatmullCurve";
import { vec2, vec3 } from "gl-matrix";
import DebugDraw from "../../dev/debugDraw/DebugDraw";

const V3_1 = vec3.create()
const V3_2 = vec3.create()

export default class ParticlesTrailActivity extends BaseActivity {


  bindGroup?: GPUBindGroup;
  quad: TexturedQuadRenderable;

  camera: Camera<PerspectiveLens>
  camCtrl: DevCameraController;
  cameraBindGroup: BindGroup;
  renderViewContext: RenderViewContext
  rendererTarget: RendererTarget;
  renderer: Renderer;
  curve: CatmullCurve;

  constructor(engine: Engine) {
    super(engine)
    this.quad = new TexturedQuadRenderable();

    this.quad.node.z = 1

    this.camera = Camera.makePerspectiveCamera()
    this.camera.z = 5
    this.camera.lens.near = 0.1
    this.camera.lens.far = 50.0
    this.camera.updateMatrix()
    this.camCtrl = new DevCameraController(engine.canvasTarget.canvas)
    this.camCtrl.start(this.camera)

    this.cameraBindGroup = CameraBindGroupFactory.createBindGroup(engine.device)

    this.curve = new CatmullCurve(engine.device)




    this.renderViewContext = {
      camera: this.camera,
      cameraBindGroup: this.cameraBindGroup,
    }
    this.rendererTarget = new RendererTarget( this.engine.canvasTarget )
    this.renderer = new Renderer( engine.device, this.rendererTarget, this.renderViewContext )
    this.renderer.addPass( new RenderPass( this.renderer, 'opaque' ) )

    this.renderer.addRenderable( this.quad )
  }

  onMouseMove = (e: MouseEvent) => {
    const x = e.clientX / window.innerWidth
    const y = e.clientY / window.innerHeight

    V3_1.set( [x*2-.5, y*2-.5, .5])
    this.camera.unproject(V3_1, V3_1)
    if( this.curve.numAnchors == 0 ){
      this.curve.addAnchor(V3_1)
    } else {
      this.curve.getAnchor(this.curve.numAnchors-1, V3_2)
      const dist = vec3.distance(V3_1, V3_2)
      if( dist > .1 ){
        this.curve.addAnchor(V3_1)
      }
    }
  }

  start(): void {
    document.addEventListener( 'mousemove',this.onMouseMove )
  }

  stop(): void {
    document.removeEventListener( 'mousemove',this.onMouseMove )
  }


  render(): void {

    for (let i = 1; i < this.curve.numAnchors; i++) {
      this.curve.getAnchor(i-1, V3_1)
      this.curve.getAnchor(i, V3_2)
      DebugDraw.drawLine( V3_1, V3_2, 0xff0000 )
    }

    this.camCtrl.update(Time.dt)
    this.camera.updateWorldMatrix()
    this.camera.updateViewProjectionMatrix(this.engine.canvasTarget.bufferWidth, this.engine.canvasTarget.bufferHeight)
    CameraBindGroupFactory.updateCameraData(this.cameraBindGroup, this.camera)



    this.renderer.render()
  }

}