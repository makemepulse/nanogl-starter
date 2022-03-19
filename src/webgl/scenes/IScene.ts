
import { RenderContext } from "@webgl/core/Renderer"
import { GLContext } from "nanogl/types"
import Lighting from "./Lighting"


export interface IScene {
  readonly gl:GLContext
  readonly lighting:Lighting

  load():Promise<void>
  unload():void

  preRender():void 
  rttPass():void 
  render(context: RenderContext):void 
}
