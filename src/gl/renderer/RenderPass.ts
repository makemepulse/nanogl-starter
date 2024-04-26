import RenderActions, { type AddCommandsActionFunction, type RenderActionOptions, type AddBundleActionFunction, DefaultCommandOnPassOptions, type BeforeRenderActionFunction } from "./RenderActions";
import type { RenderViewContext } from "./RenderViewContext";
import type Renderer from "./Renderer";
import type { RendererTarget } from "./RendererTarget";





/**
 * object passed to renderable.render() method to populate the render pass encoder
 */
export default class RenderPass {

  private _invalid = true

  private _actions: RenderActions = new RenderActions()



  constructor(
    readonly renderer: Renderer,
    readonly name: string,
  ) {

  }

  addCommands( callback: AddCommandsActionFunction, options : RenderActionOptions = DefaultCommandOnPassOptions ){
    this._actions.addCommands( callback, options )
  }
  
  addBundle(callback: AddBundleActionFunction, options : RenderActionOptions = DefaultCommandOnPassOptions ){
    this._actions.addBundle( callback, options )
  }

  beforeRender( callback: BeforeRenderActionFunction ){
    this._actions.beforeRender( callback )
  }



  /**
   * called by renderables to invalidate the previously render pass encoder 
  */
  invalidate() {
    this._invalid = true
  }

  isInvalid(): boolean {
    return this._invalid
  }

  executeBeforeRenderActions(){
    this._actions.executeBeforeRenderActions( this.renderer.viewContext )
  }

  encodePendingBundles( rendererTarget: RendererTarget ){

    const encoder = this.renderer.device.createRenderBundleEncoder({
      colorFormats: [rendererTarget.getColorAttachmentFormat()],
      depthStencilFormat: rendererTarget.depthStencilFormat,
    })

    this._actions.encodePendingBundles( encoder, this.renderer.viewContext )

  }

  encode(commandEncoder: GPUCommandEncoder, viewContext: RenderViewContext): void {

    const passEncoder = commandEncoder.beginRenderPass({
      label: `RenderPass ${this.name}`,
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

      
    passEncoder.setBindGroup(0, viewContext.cameraBindGroup.getBindGroup() );
    
    const renderActions = this._actions.getRenderActions()
    for( let action of renderActions ){
      action.execute( passEncoder, viewContext )
    }

    passEncoder.end()
    
  }



}
