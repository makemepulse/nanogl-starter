import Signal from "../../utils/Signal"


export default class CanvasTarget {

  private _canvas: HTMLCanvasElement
  private _context: GPUCanvasContext
  private _resizeObserver: ResizeObserver
  private _format: GPUTextureFormat | null = null


  readonly onResize = new Signal<void>()

  cssWidth: number = 0
  cssHeight: number = 0

  bufferWidth: number = 0
  bufferHeight: number = 0
  
  private _device: GPUDevice | null = null
  private _depthStencilTexture: GPUTexture | null = null

  public get canvas(): HTMLCanvasElement {
    return this._canvas
  }

  get pixelRatio(): number {
    if (this._pixelRatio < 0.0) {
      this._pixelRatio = window.devicePixelRatio;
    }
    return this._pixelRatio;
  }

  set pixelRatio(value: number) {
    if (this._pixelRatio === value) return;
    this._pixelRatio = value;
    this.updateSize();
  }

  get format(): GPUTextureFormat {
    if (this._format === null) {
      throw new Error("CanvasTarget format is not set. Attach to device first.");
    }
    return this._format;
  }

  constructor(canvas?: HTMLCanvasElement, private _pixelRatio: number = -1.0) {

    if (!canvas) {
      canvas = document.createElement('canvas')
    }

    this._canvas = canvas

    this._context = canvas.getContext("webgpu")!;


    this._resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      this._handleResize(width, height);
    })

    this._resizeObserver.observe(this._canvas)

  }

  private _handleResize(w: number, h: number) {
    if (isNaN(w) || isNaN(h) || w === 0 || h === 0) {
      return false;
    }
    if (w !== this.cssWidth || h !== this.cssHeight) {

      this.cssWidth = w;
      this.cssHeight = h;
      this.updateSize();
    }
    return true;
  }

  updateSize(): void {
    const pr = this.pixelRatio;
    this.bufferWidth = this.canvas.width = pr * this.cssWidth;
    this.bufferHeight = this.canvas.height = pr * this.cssHeight;
    this.onResize.emit();
  }

  attach(device: GPUDevice) {
    this._device = device;
    this._format = navigator.gpu.getPreferredCanvasFormat();
    this._context.configure({
      device: device,
      format: this._format,
    });
  }

  getDepthStencilTexture(): GPUTexture {
    if (this._device === null) {
      throw new Error("Device is not attached");
    }

    if( this._depthStencilTexture === null || this._depthStencilTexture.height !== this.currentTexture.width || this._depthStencilTexture.width !== this.currentTexture.height ){
      
      this._depthStencilTexture?.destroy();

      const canvasTex = this._context.getCurrentTexture()
      this._depthStencilTexture = this._device.createTexture({
        size: [canvasTex.width, canvasTex.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }

    return this._depthStencilTexture;
  }

  get currentTexture(): GPUTexture {
    return this._context.getCurrentTexture()
  }

  createView(): GPUTextureView {
    return this._context.getCurrentTexture().createView()
  }


}