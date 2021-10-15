import { GLContext } from "nanogl/types";
import Camera from "nanogl-camera";
import GLState from "nanogl-state";


export default interface IRenderer {
  readonly glstate   : GLState
  readonly gl : GLContext
  readonly camera : Camera
  readonly width : number
  readonly height : number
}