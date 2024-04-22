import Camera from "nanogl-camera";
import type PerspectiveLens from "nanogl-camera/perspective-lens";
import Node from "nanogl-node";
import type Engine from "../Engine";
import DevCameraController from "../cameras/DevCameraController";
import { BaseActivity } from "../core/Activity";
import type { RenderContext } from "../core/RenderContext";
import Time from "../core/Time";
import DebugDraw from "../dev/debugDraw/DebugDraw";
import SimpleTexturedQuad from "./SimpleTexturedQuad";


export default class SampleActivity extends BaseActivity {


  bindGroup?: GPUBindGroup;
  texturedQuad: SimpleTexturedQuad;

  camera: Camera<PerspectiveLens>
  camCtrl: DevCameraController;
  node: Node;

  constructor(engine: Engine) {
    super(engine)
    this.texturedQuad = new SimpleTexturedQuad(engine);
    this.add(this.texturedQuad.texRes1)

    this.camera = Camera.makePerspectiveCamera()
    this.camera.z = 5
    this.camera.updateMatrix()
    this.camCtrl = new DevCameraController(engine.canvasTarget.canvas)
    this.camCtrl.start(this.camera)

    this.node = new Node()

  }

  start(): void {
    this.texturedQuad.init()
  }

  stop(): void {

  }

  render(): void {

    this.node.rotateX( Time.dt * 0.5 )
    this.node.rotateZ( Time.dt * 0.3 )
    this.node.updateWorldMatrix()

    DebugDraw.drawCircle(this.node._wmatrix, 1)

    this.camCtrl.update(Time.dt)
    this.camera.updateWorldMatrix()
    this.camera.updateViewProjectionMatrix(this.engine.canvasTarget.bufferWidth, this.engine.canvasTarget.bufferHeight)

    const encoder = this.engine.device.createCommandEncoder();

    const passEncoder = encoder.beginRenderPass({
      label: 'SampleActivity render pass',
      colorAttachments: [{
        view: this.engine.canvasTarget.createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.0, a: 1.0 },
        storeOp: "store",
      }],
    })

    

    const context: RenderContext = {
      camera : this.camera,
      renderPassEncoder: passEncoder,
    }

    this.texturedQuad.render( context )

    DebugDraw.render(context)

    passEncoder.end();

    this.engine.device.queue.submit([encoder.finish()]);
  }

}