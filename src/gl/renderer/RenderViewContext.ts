import type Camera from "nanogl-camera";
import type { BindGroup } from "../core/BindGroup";


export interface RenderViewContext {

  camera: Camera;
  cameraBindGroup: BindGroup;

}
