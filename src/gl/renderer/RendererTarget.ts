import type CanvasTarget from "../core/CanvasTarget"


export class RendererTarget {

  constructor( private _canvasTarget: CanvasTarget ){

  }

  createColorAttachmentView( i:number = 0 ) {
    i;
    return this._canvasTarget.createView()
  }

  createDepthStencilAttachmentView() {
    return this._canvasTarget.getDepthStencilTexture().createView()
  }

  hasDepthStencilAttachment() {
    return true
  }

  getColorAttachmentFormat( i:number = 0 ): GPUTextureFormat {
    i;
    return this._canvasTarget.format
  }

  get depthStencilFormat(): GPUTextureFormat {
    return "depth24plus"
  }

}