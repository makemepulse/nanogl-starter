import RenderPass from "./RenderPass"
import type { RenderViewContext } from "./RenderViewContext"
import { type IRenderable, type ResourceAllocationContext } from "./Renderable"
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

  private _resourceAllocationContext: ResourceAllocationContext

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
  constructor( readonly device: GPUDevice, readonly target: RendererTarget, readonly viewContext: RenderViewContext ) {

    this._resourceAllocationContext = {
      colorFormat: target.getColorAttachmentFormat(0),
      depthStencilFormat: target.depthStencilFormat
    }

  }


  addRenderable( renderable: IRenderable ){
    renderable.allocateResources( this.device, this._resourceAllocationContext ).then( () => {
      this._renderables.push( renderable )
      renderable.addedToRenderer( this )
    })
  }

  removeRenderable( renderable: IRenderable ){
    const idx = this._renderables.indexOf( renderable )
    if( idx >= 0 ){
      this._renderables.splice( idx, 1 )
      // dealloc 
    }
  }

  hasPass( pass:  RenderPass ){
    return this._passesByName.has( pass.name )
  }

  addPass( pass:  RenderPass ){
    if( this.hasPass( pass ) ) {
      throw new Error(`Pass ${pass.name} already exists`)
    }
    this._passes.push( pass )
    this._passesByName.set( pass.name, pass )
  }

  getPass( name: string ): RenderPass {
    const pass = this._passesByName.get( name )
    if( pass === undefined ) {
      throw new Error(`Pass ${name} not found`)
    }
    return pass
  }


  
  
  private _buildCommands() {

    for( let pass of this._passes ){
      pass.executeBeforeRenderActions()
    }
    
    for( let pass of this._passes ){
      pass.encodePendingBundles( this.target )
    }
    
    const commandEncoder = this.device.createCommandEncoder()

    for( let pass of this._passes ){
      pass.encode( commandEncoder, this.viewContext )
    }

    return commandEncoder.finish()

  }

  render(){
    this.device.queue.submit([this._buildCommands()])
  }

}