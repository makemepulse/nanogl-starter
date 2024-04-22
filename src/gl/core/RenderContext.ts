import type Camera from "nanogl-camera";


export interface RenderContext {

  camera: Camera;

  // renderPassDecriptor: GPURenderPassDescriptor;

  renderPassEncoder: GPURenderPassEncoder;

}
