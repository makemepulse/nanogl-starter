import type { AnyPromise } from "../../utils/AnyPromise";
import type RenderPass from "./RenderPass"
import { RenderableQueue } from "./RenderableQueue"
import type Renderer from "./Renderer"


export type ResourceAllocationContext = {
  readonly colorFormat: GPUTextureFormat;
  readonly depthStencilFormat: GPUTextureFormat;
}


export interface IRenderable {
  
  readonly ready?: AnyPromise

  // invalidate():void
  // allocateResources( device:GPUDevice, context: ResourceAllocationContext ):Promise<void>

  dispose():void

  addedToRenderer( renderer:Renderer ): void;

}

export default abstract class Renderable implements IRenderable{

  /**
   * renderable priority
   */
  private _queue: RenderableQueue | number = RenderableQueue.Opaque

  public get queue(): RenderableQueue | number {
    return this._queue
  }

  public set queue(value: RenderableQueue | number) {
    if (this._queue === value) return
    this._queue = value
    this.invalidateRenderPass()
  }


  protected _lastRenderPass: RenderPass | null = null

  constructor(
  ) {

  }

  /**
   * create pipeline, load textures etc
   */
  abstract allocateResources(renderer: Renderer): Promise<void>;

  /**
   * update buffers, textures etc
   */
  abstract updateResources(): void;

  /**
   * push render commands to render pass encoder
   */
  render(context: RenderPass) {
    this._lastRenderPass = context
  }

  invalidateRenderPass() {
    this._lastRenderPass?.invalidate()
  }


}