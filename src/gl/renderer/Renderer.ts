import type Camera from "nanogl-camera"
import { CameraBindGroupFactory } from "../core/BindGroup"
import { DebugDrawImpl } from "../dev/debugDraw/DebugDraw"
import RenderPass from "./RenderPass"
import type { RenderViewContext } from "./RenderViewContext"
import { type IRenderable } from "./Renderable"
import type { RendererTarget } from "./RendererTarget"



/**
 * frame:
 *   GPUCommandBuffer..
 *     GPURenderPassEncoder(attachments)
 *      
 *      [
 *        setPipeleine
 *        ...
 *        draw
 *      ]
 *      or
 *      [
 *        GPURenderBundle
 *      ]
 *      end()
 * 
 *     
 */


export default class Renderer {

  private _renderables: IRenderable[] = []

  private _passes: RenderPass[] = []
  private _passesByName = new Map<string, RenderPass>()

  private _setupedRenderable: IRenderable | null = null

  readonly defaultPass: RenderPass

  private viewContext: RenderViewContext
  
  /// #if DEBUG
  readonly debugDraw: DebugDrawImpl
  /// #endif

  /**
   * 
   * @param device 
   * 
   * 
   * render
   *   render scene : set of renderables, create mainEncoder
  *      collect additional encoders from renderables ( eg: rtt passes)
   *     render view : cameras + render targets
   *       render passes : beginRenderPass for each (opaque, blended, stencil?)
   *         renderables (sorted by renderQueue)
   * 
   *      
   * 
   * setup
   *  - create render pass contexts
   *    for each pass create a renderPassDescriptor
   * 
   * scene building steps:
   *  - create command encoders 
   *  - collect encoders command
   * 
   * render steps: 
   *  - allocate render targets if needed
   *  - update gpu resources, buffers
   *  - submit render pass encoders
   */
  constructor(
    readonly device: GPUDevice,
    readonly target: RendererTarget,
    readonly camera: Camera
  ) {

    // this._resourceAllocationContext = {
    //   colorFormat: target.getColorAttachmentFormat(0),
    //   depthStencilFormat: target.depthStencilFormat
    // }


    const cameraBindGroup = CameraBindGroupFactory.createBindGroup(device)

    this.defaultPass = new RenderPass(this, 'default')
    this.addPass(this.defaultPass)

    /// #if DEBUG
    const debugDraw = new DebugDrawImpl(device)
    debugDraw.setupRenderer(this)
    this.debugDraw = debugDraw
    /// #endif

    this.viewContext = {
      camera,
      target,
      cameraBindGroup,
      /// #if DEBUG
      debugDraw,
      /// #endif
    }


  }


  addRenderable(renderable: IRenderable) {
    //TODO: handle renderable removed while allocating resources
    if( renderable.ready !== undefined ){
      renderable.ready.then( () => {
        this._setupRenderable(renderable)
      })
    } else {
      this._setupRenderable(renderable)
    }
  }
  
  private _setupRenderable(renderable: IRenderable) {
    
    this._setupedRenderable = renderable
    for (let pass of this._passes) pass.setCurrentActionOwner(renderable)
  
    renderable.addedToRenderer(this)
  
    for (let pass of this._passes) pass.setCurrentActionOwner(null)
      this._setupedRenderable = null
    
    this._renderables.push(renderable)

  }
  
  removeRenderable(renderable: IRenderable) {
    const idx = this._renderables.indexOf(renderable)
    if (idx >= 0) {
      this._renderables.splice(idx, 1)
      
      for (let pass of this._passes) pass.clearOwnerActions(renderable)
      // dealloc 
    }
  }

  hasPass(pass: RenderPass) {
    return this._passesByName.has(pass.name)
  }

  addPass(pass: RenderPass) {
    if (this.hasPass(pass)) {
      throw new Error(`Pass ${pass.name} already exists`)
    }
    pass.setCurrentActionOwner(this._setupedRenderable)
    this._passes.push(pass)
    this._passesByName.set(pass.name, pass)
  }

  getPass(name: string): RenderPass {
    const pass = this._passesByName.get(name)
    if (pass === undefined) {
      throw new Error(`Pass ${name} not found`)
    }
    return pass
  }




  private _buildCommands() {

    for (let pass of this._passes) {
      pass.executeBeforeRenderActions(this.viewContext)
    }

    for (let pass of this._passes) {
      pass.encodePendingBundles(this.viewContext)
    }

    const commandEncoder = this.device.createCommandEncoder()

    for (let pass of this._passes) {
      pass.encode(commandEncoder, this.viewContext)
    }


    return commandEncoder.finish()

  }

  render() {


    this.camera.updateWorldMatrix()
    this.camera.updateViewProjectionMatrix(this.target.width, this.target.height)
    CameraBindGroupFactory.updateCameraData(this.viewContext.cameraBindGroup, this.camera)

    const commandBuffer = this._buildCommands()

    for (let pass of this._passes) {
      pass.executeBeforeSubmitActions(this.viewContext)
    }

    this.device.queue.submit([commandBuffer])


    for (let pass of this._passes) {
      pass.executeAfterRenderActions(this.viewContext)
    }
  }

}