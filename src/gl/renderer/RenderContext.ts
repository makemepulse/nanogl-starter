import type Camera from "nanogl-camera";
import type { BindGroup } from "../core/BindGroup";

/**
 * @deprecated
 */
export interface RenderContext {

  camera: Camera;
  cameraBindGroup: BindGroup;

  // renderPassDecriptor: GPURenderPassDescriptor;

  renderPassEncoder: GPURenderPassEncoder;

}
