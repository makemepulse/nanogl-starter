import type Renderer from "./Renderer";


export enum RenderPassType {
  OPAQUE,
  BLENDED,
}

/**
 * object passed to renderable.render() method to populate the render pass encoder
 */
export default class RenderPass {

  private _invalid = true

  private _encoder: GPURenderPassEncoder | null = null
  private _commandEncoder: GPUCommandEncoder | null = null;
  private _commandBuffer: GPUCommandBuffer | null = null;

  public get commandBuffer(): GPUCommandBuffer {
    if( this._commandBuffer === null ){
      throw new Error('RenderPass not ended')
    }
    return this._commandBuffer;
  }

  get encoder() {
    if( this._encoder === null ) {
      this._encoder = this.createRenderPassEncoder()
    }
    return this._encoder
  }


  constructor(
    readonly renderer: Renderer,
    readonly type: RenderPassType,
  ) {

  }

  private createRenderPassEncoder() : GPURenderPassEncoder {
    this._commandEncoder = this.renderer.device.createCommandEncoder();

    return this._commandEncoder.beginRenderPass({
      label: 'Renderer render pass',
      colorAttachments: [{
        view: this.renderer.target.createColorAttachmentView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.0, a: 1.0 },
        storeOp: "store",
      }],
      depthStencilAttachment: this.renderer.target.hasDepthStencilAttachment() ? {
        view: this.renderer.target.createDepthStencilAttachmentView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1.0,
      } : undefined
    })
  }

  begin(){
     // this.encoder.setViewport ....

  }

  end(){
    if( this._encoder === null ) throw new Error('RenderPass not started')
    this._encoder?.end()
    this._commandBuffer = this._commandEncoder!.finish()
    this._invalid = false
  }

  /**
   * called by renderables to invalidate the previously render pass encoder 
  */
  invalidate() {
    this._invalid = true
    this._encoder = null
  }

  isInvalid(): boolean {
    return this._invalid
  }

}
