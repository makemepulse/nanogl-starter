import type CanvasTarget from "../core/CanvasTarget"

export interface RendererTarget {
  readonly width: number
  readonly height: number
  readonly depthStencilFormat: GPUTextureFormat

  createColorAttachmentView( i?:number ): GPUTextureView
  createDepthStencilAttachmentView(): GPUTextureView
  hasDepthStencilAttachment(): boolean
  getColorAttachmentFormat( i?:number ): GPUTextureFormat
}


export class RendererCanvasTarget implements RendererTarget {

  constructor( private _canvasTarget: CanvasTarget ){

  }

  get width() {
    return this._canvasTarget.bufferWidth
  }

  get height() {
    return this._canvasTarget.bufferHeight
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


export class RendererTextureTarget implements RendererTarget {

  private _texture: GPUTexture | null = null
  private _depthStencilTexture : GPUTexture | null = null

  private _width: number = 0
  private _height: number = 0

  constructor( private device: GPUDevice ){

  }
  
  get width() {
    return this._width
  }

  get height() {
    return this._height
  }

  get depthStencilFormat(): GPUTextureFormat {
    return "depth24plus"
  }

  createColorAttachmentView(i: number = 0): GPUTextureView {
    i;
    return this._texture!.createView()
  }
  createDepthStencilAttachmentView(): GPUTextureView {
    return this._depthStencilTexture!.createView()
  }
  hasDepthStencilAttachment(): boolean {
    return true
  }
  getColorAttachmentFormat(i: number = 0): GPUTextureFormat {
    i;
    return "rgba8unorm"
  }

  setSize( width: number, height: number ){
    if( this._width !== width || this._height !== height ){
      this._width = width
      this._height = height
      this._allocateTextures()
    }
  }

  private _allocateTextures(): void {

    this._texture?.destroy()
    this._depthStencilTexture?.destroy();

    this._texture = this.device.createTexture({
      size: [this._width, this._height],
      format: "rgba8unorm",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    
  
    this._depthStencilTexture = this.device.createTexture({
      size: [this._width, this._height],
      format: this.depthStencilFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

}