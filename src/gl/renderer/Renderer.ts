import RenderPass, { RenderPassType } from "./RenderPass"
import type { RenderViewContext } from "./RenderViewContext"
import Renderable from "./Renderable"
import type { RendererTarget } from "./RendererTarget"




export default class Renderer {

  private _renderabes: Renderable[] = []

  private _renderPass: RenderPass

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
    this._renderPass = new RenderPass( this, RenderPassType.OPAQUE )
  }


  addRenderable( renderable: Renderable ){
    renderable.allocateResources( this ).then( () => {
      this._renderabes.push( renderable )
    })
  }

  removeRenderable( renderable: Renderable ){
    const idx = this._renderabes.indexOf( renderable )
    if( idx >= 0 ){
      this._renderabes.splice( idx, 1 )
      // dealloc 
    }
  }


  
  
  buildRenderPassIfNeeded() {
    if( this._renderPass.isInvalid() ){
      this._renderPass.begin()

      this._renderPass.encoder.setBindGroup(0, this.viewContext.cameraBindGroup.getBindGroup() );
      this._renderabes.forEach( renderable => renderable.render( this._renderPass ) )
      this._renderPass.end()
    }
  }

  render(){
    this.buildRenderPassIfNeeded()
    this._renderabes.forEach( renderable => renderable.updateResources() )
    this.device.queue.submit([this._renderPass.commandBuffer]);
    this._renderPass.invalidate()
  }

}