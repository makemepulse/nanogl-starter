import { GLContext } from "nanogl/types";
import Camera from "nanogl-camera";
import GLState from "nanogl-state";
import GLConfig from "nanogl-state/config";
import RenderMask from "./RenderMask";
import RenderPass from "./RenderPass";


export default interface IRenderer {
  readonly glstate   : GLState
  readonly gl : GLContext
  readonly camera : Camera
  readonly width : number
  readonly height : number
  
}


export interface IRenderContext {
  readonly renderer  : IRenderer
  readonly camera   : Camera
  readonly mask     : RenderMask
  readonly pass     : RenderPass
  readonly glConfig?: GLConfig
}