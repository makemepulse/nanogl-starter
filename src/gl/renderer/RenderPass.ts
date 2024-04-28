import RenderActions, { DefaultCommandOnPassOptions, type AddCommandsActionFunction, type BeforeRenderActionFunction, type EncodeBundleActionFunction, type ExecuteBundleActionFunction, type RenderActionOptions, type RenderActionOwner, type RenderCommandsActionContext } from "./RenderActions";
import type { RenderViewContext } from "./RenderViewContext";
import type Renderer from "./Renderer";





/**
 * object passed to renderable.render() method to populate the render pass encoder
 */
export default class RenderPass {

  private _invalid = true

  private _actions: RenderActions = new RenderActions()

  private _currentSetupOwner: RenderActionOwner | null = null

  
  constructor(
    readonly renderer: Renderer,
    readonly name: string,
  ) {
    
  }
  
  setCurrentActionOwner( owner: RenderActionOwner | null ){
    this._currentSetupOwner = owner
  }
  
  addCommands( callback: AddCommandsActionFunction, options : RenderActionOptions = DefaultCommandOnPassOptions ){
    this._actions.addCommands( callback, options, this._currentSetupOwner )
  }
  
  /**
   * 
   * @param callback 
   * @param execFunc 
   * @param options 
   */
  addBundle(callback: EncodeBundleActionFunction, execFunc: ExecuteBundleActionFunction | null = null, options : RenderActionOptions = DefaultCommandOnPassOptions ){
    this._actions.addBundle( callback, execFunc, options, this._currentSetupOwner )
  }

  beforeRender( callback: BeforeRenderActionFunction ){
    this._actions.beforeRender( callback, this._currentSetupOwner )
  }

  afterRender( callback: BeforeRenderActionFunction ){
    this._actions.afterRender( callback, this._currentSetupOwner )
  }

  beforeSubmit( callback: BeforeRenderActionFunction ){
    this._actions.beforeSubmit( callback, this._currentSetupOwner )
  }

  clearOwnerActions( owner: RenderActionOwner ){
    this._actions.clearOwnerActions( owner )
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

  executeBeforeRenderActions( viewContext: RenderViewContext ){
    this._actions.executeBeforeRenderActions( viewContext )
  }

  executeAfterRenderActions( viewContext: RenderViewContext ){
    this._actions.executeAfterRenderActions( viewContext )
  }

  executeBeforeSubmitActions( viewContext: RenderViewContext ){
    this._actions.executeBeforeSubmitActions( viewContext )
  }

  encodePendingBundles( viewContext: RenderViewContext ){
    this._actions.encodePendingBundles( this.renderer.device, viewContext )
  }

  encode(commandEncoder: GPUCommandEncoder, viewContext: RenderViewContext): void {

    const passEncoder = commandEncoder.beginRenderPass({
      label: `RenderPass ${this.name}`,
      colorAttachments: [{
        view: viewContext.target.createColorAttachmentView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.0, a: 1.0 },
        storeOp: "store",
      }],
      depthStencilAttachment: viewContext.target.hasDepthStencilAttachment() ? {
        view: viewContext.target.createDepthStencilAttachmentView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1.0,
      } : undefined
    })

      
    passEncoder.setBindGroup(0, viewContext.cameraBindGroup.getBindGroup() );
    
    const commandsContext: RenderCommandsActionContext = {
      ...viewContext,
      encoder: passEncoder,
    }
    
    const renderActions = this._actions.getRenderActions()
    for( let action of renderActions ){
      action.execute( commandsContext )
      // passEncoder.setBindGroup(0, viewContext.cameraBindGroup.getBindGroup() );
    }

    passEncoder.end()
    
  }



}
