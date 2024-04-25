import type RenderPass from "./RenderPass"
import { RenderableQueue } from "./RenderableQueue"
import type Renderer from "./Renderer"


export default abstract class Renderable {

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