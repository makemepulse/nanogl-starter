import Camera from "nanogl-camera";
import type PerspectiveLens from "nanogl-camera/perspective-lens";
import type Engine from "../Engine";
import DevCameraController from "../cameras/DevCameraController";
import { BaseActivity } from "../core/Activity";
import Time from "../core/Time";
import Renderer from "../renderer/Renderer";
import { RendererTarget } from "../renderer/RendererTarget";
import TexturedQuadRenderable from "./TexturedQuadRenderable";


export default class TestActivity extends BaseActivity {


  bindGroup?: GPUBindGroup;
  quad: TexturedQuadRenderable;

  camera: Camera<PerspectiveLens>
  camCtrl: DevCameraController;
  rendererTarget: RendererTarget;
  renderer: Renderer;

  constructor(engine: Engine) {
    super(engine)
    this.quad = new TexturedQuadRenderable( engine.device );

    this.quad.node.z = 1

    this.camera = Camera.makePerspectiveCamera()
    this.camera.z = 5
    this.camera.lens.near = 0.1
    this.camera.lens.far = 50.0
    this.camera.updateMatrix()
    this.camCtrl = new DevCameraController(engine.canvasTarget.canvas)
    this.camCtrl.start(this.camera)


    this.rendererTarget = new RendererTarget( this.engine.canvasTarget )
    this.renderer = new Renderer( engine.device, this.rendererTarget, this.camera)
    this.renderer.addRenderable( this.quad )
  }

  start(): void {
    
  }

  stop(): void {

  }


  render(): void {

    this.camCtrl.update(Time.dt)

    this.renderer.render()
  }

}