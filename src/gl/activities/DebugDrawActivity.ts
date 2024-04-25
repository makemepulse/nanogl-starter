import { vec3 } from "gl-matrix";
import Camera from "nanogl-camera";
import type PerspectiveLens from "nanogl-camera/perspective-lens";
import Node from "nanogl-node";
import type Engine from "../Engine";
import DevCameraController from "../cameras/DevCameraController";
import { BaseActivity } from "../core/Activity";
import { CameraBindGroupFactory, type BindGroup } from "../core/BindGroup";
import type { RenderContext } from "../renderer/RenderContext";
import Time from "../core/Time";
import DebugDraw from "../dev/debugDraw/DebugDraw";
import SimpleTexturedQuad from "./SimpleTexturedQuad";


export default class DebugDrawActivity extends BaseActivity {


  bindGroup?: GPUBindGroup;
  texturedQuad: SimpleTexturedQuad;

  camera: Camera<PerspectiveLens>
  camCtrl: DevCameraController;
  node: Node;
  cameraBindGroup: BindGroup;

  constructor(engine: Engine) {
    super(engine)
    this.texturedQuad = new SimpleTexturedQuad(engine);
    this.add(this.texturedQuad.texRes1)

    this.camera = Camera.makePerspectiveCamera()
    this.camera.z = 5
    this.camera.lens.near = 0.1
    this.camera.lens.far = 50.0
    this.camera.updateMatrix()
    this.camCtrl = new DevCameraController(engine.canvasTarget.canvas)
    this.camCtrl.start(this.camera)

    this.cameraBindGroup = CameraBindGroupFactory.createBindGroup(engine.device)

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

    DebugDraw.drawAxis(this.node._wmatrix)

    DebugDraw.drawLine( vec3.fromValues(0,0,0), vec3.fromValues(1,1,1) )
    DebugDraw.drawCone(this.node._wmatrix, 3, Math.PI/8)

    this.camCtrl.update(Time.dt)
    this.camera.updateWorldMatrix()
    this.camera.updateViewProjectionMatrix(this.engine.canvasTarget.bufferWidth, this.engine.canvasTarget.bufferHeight)


    CameraBindGroupFactory.updateCameraData(this.cameraBindGroup, this.camera)
    
    const encoder = this.engine.device.createCommandEncoder();

    const passEncoder = encoder.beginRenderPass({
      label: 'SampleActivity render pass',
      colorAttachments: [{
        view: this.engine.canvasTarget.createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.0, a: 1.0 },
        storeOp: "store",
      }],
      depthStencilAttachment: {
        view: this.engine.canvasTarget.getDepthStencilTexture().createView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1.0,
      }
    })

    

    const context: RenderContext = {
      camera : this.camera,
      cameraBindGroup: this.cameraBindGroup,
      renderPassEncoder: passEncoder,
    }

    this.texturedQuad.render( context )

    DebugDraw.render(context)

    passEncoder.end();

    this.engine.device.queue.submit([encoder.finish()]);
  }

}