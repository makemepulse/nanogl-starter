import { GLContext } from "nanogl/types";
import Camera from "nanogl-camera";
import Bounds from "nanogl-pbr/Bounds";
import Node from "../elements/Node";
import GLConfig from "nanogl-state/GLConfig";



export default interface IRenderable {

  readonly node: Node
  readonly bounds : Bounds
  render( gl:GLContext, camera:Camera, mask:number, passId : string, cfg?:GLConfig ) : void 
}
