import type Camera from "nanogl-camera";
import type { BindGroup } from "../core/BindGroup";
import type { RendererTarget } from "./RendererTarget";
import type { DebugDrawImpl } from "../dev/debugDraw/DebugDraw";


export interface RenderViewContext {
  readonly target: RendererTarget, 
  readonly camera: Camera;
  readonly cameraBindGroup: BindGroup;

  /// #if DEBUG
  readonly debugDraw?: DebugDrawImpl;
  /// #endif
}
