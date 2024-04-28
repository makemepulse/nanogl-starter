import type { RenderViewContext } from "./RenderViewContext";


export type RenderActionOwner = any

export type RenderActionOptions = {
  priority?: number
}

export const DefaultCommandOnPassOptions : Readonly<RenderActionOptions> = {
  priority: 0
}


export type RenderCommandsActionContext = RenderViewContext & {
  encoder: GPURenderPassEncoder
}

export type RenderBundleActionContext = RenderViewContext & {
  encoder: GPURenderBundleEncoder
}

export type RenderActionContext = RenderCommandsActionContext | RenderBundleActionContext


export type BeforeRenderActionFunction = ( context: RenderViewContext ) => void
export type AddCommandsActionFunction = ( context: RenderCommandsActionContext ) => void
export type EncodeBundleActionFunction = ( context: RenderBundleActionContext ) => void
export type ExecuteBundleActionFunction = ( context: RenderViewContext ) => boolean

type RenderActionFunction = AddCommandsActionFunction | EncodeBundleActionFunction | BeforeRenderActionFunction

enum RenderActionType {
  AddCommands,
  AddBundle,
  BeforeRender
}

interface RenderAction<TContext extends RenderViewContext = RenderViewContext> {

  readonly owner: RenderActionOwner | null

  readonly priority: number

  readonly type: RenderActionType

  readonly action: RenderActionFunction

  execute( context: TContext ):void;
}



class AddBundleAction implements RenderAction<RenderCommandsActionContext> {

  readonly type = RenderActionType.AddBundle

  readonly priority : number;

  private _bundle: GPURenderBundle | null = null

  constructor( readonly action: EncodeBundleActionFunction, readonly options: RenderActionOptions, readonly execFunc: ExecuteBundleActionFunction | null, readonly owner: RenderActionOwner | null = null){
    this.priority = options.priority ?? 0
    this.action = action
  }


  encode( context: RenderBundleActionContext ): void {
    this.action( context ) 
    this._bundle = context.encoder.finish()
  }

  execute( context: RenderCommandsActionContext ){
    if( this.execFunc && !this.execFunc( context ) ) return
    context.encoder.executeBundles( [this._bundle!] )
  }

}


class AddCommandsAction implements RenderAction<RenderCommandsActionContext> {

  readonly type = RenderActionType.AddCommands

  readonly priority : number;

  constructor( readonly action: AddCommandsActionFunction, readonly options: RenderActionOptions, readonly owner: RenderActionOwner | null = null ){
    this.priority = options.priority ?? 0
  }

  execute( context: RenderCommandsActionContext ){
    this.action( context )
  }

}

class BeforeRenderAction implements RenderAction<RenderViewContext> {

  readonly type = RenderActionType.BeforeRender

  readonly priority : number;

  constructor( readonly action: BeforeRenderActionFunction , readonly options: RenderActionOptions, readonly owner: RenderActionOwner | null = null ){
    this.priority = options.priority ?? 0
  }

  execute( context: RenderViewContext ){
    this.action( context )
  }

}

type RenderEncodingAction = AddCommandsAction | AddBundleAction

export default class RenderActions {

  private _beforeRender: BeforeRenderAction[] = []
  private _afterRender: BeforeRenderAction[] = []
  private _beforeSubmit: BeforeRenderAction[] = []
  private _commands: AddCommandsAction[] = []
  private _bundles: AddBundleAction[] = []
  private _pendingBundles: AddBundleAction[] = []
  
  private _actions: RenderEncodingAction[] = []

  private _rebuildActions = true
  private _sorted = false

  getRenderActions(): RenderAction[] {
    if( this._rebuildActions ){
      this._actions = [...this._commands, ...this._bundles]
      this._rebuildActions = false
      this._sorted = false
    }
    if( !this._sorted ){
      this._actions.sort( ( a, b ) => a.priority - b.priority )
      this._sorted = true
    }
    return this._actions
  }

  getBundleActions(): AddBundleAction[] {
    return this._bundles
  }
 
  getPendingBundleActions(): AddBundleAction[] {
    return this._pendingBundles
  }

  hasPendingBundles(): boolean {
    return this._pendingBundles.length > 0
  }

  encodePendingBundles( device: GPUDevice, viewContext: RenderViewContext ){
    if(  this._pendingBundles.length === 0 ) return

    for( const action of this._pendingBundles ){
      const encoder = device.createRenderBundleEncoder({
        colorFormats: [viewContext.target.getColorAttachmentFormat()],
        depthStencilFormat: viewContext.target.depthStencilFormat,
      })

      const bundleContext: RenderBundleActionContext = {
        ...viewContext,
        encoder,
      }

      action.encode( bundleContext )
    }
    this._bundles.push( ...this._pendingBundles )
    this._pendingBundles = []
    this._rebuildActions = true
    this._sorted = false
  }
  

  executeBeforeRenderActions( context: RenderViewContext ){
    for( const action of this._beforeRender ) action.execute( context )
  }

  executeAfterRenderActions( context: RenderViewContext ){
    for( const action of this._afterRender ) action.execute( context )
  }

  executeBeforeSubmitActions( context: RenderViewContext ){
    for( const action of this._beforeSubmit ) action.execute( context )
  }

  
  addCommands( callback: AddCommandsActionFunction, options : RenderActionOptions = DefaultCommandOnPassOptions, owner: RenderActionOwner | null = null  ){
    const action = new AddCommandsAction( callback, options, owner )
    this._commands.push( action )
    this._rebuildActions = true
    this._sorted = false
  }

  removeCommands( callback: RenderActionFunction ){
    const idx = this._commands.findIndex( a => a.action === callback )
    if( idx >= 0 ){
      this._commands.splice( idx, 1 )
      this._rebuildActions = true
      this._sorted = false
    }
  }
  
  addBundle( callback: EncodeBundleActionFunction, execFunc: ExecuteBundleActionFunction | null = null,  options : RenderActionOptions = DefaultCommandOnPassOptions, owner: RenderActionOwner | null = null  ){
    const action = new AddBundleAction( callback, options, execFunc, owner )
    this._pendingBundles.push( action )
  }

  removeBundle( callback: EncodeBundleActionFunction ){
    let idx = this._pendingBundles.findIndex( a => a.action === callback )
    if( idx >= 0 ){
      this._pendingBundles.splice( idx, 1 )
    }
    idx = this._bundles.findIndex( a => a.action === callback )
    if( idx >= 0 ){
      this._bundles.splice( idx, 1 )
      this._rebuildActions = true
      this._sorted = false
    }
  }

  beforeRender( callback: BeforeRenderActionFunction, options : RenderActionOptions = DefaultCommandOnPassOptions, owner: RenderActionOwner | null = null  ){
    this._beforeRender.push( new BeforeRenderAction( callback, options, owner ) )
  }

  afterRender( callback: BeforeRenderActionFunction, options : RenderActionOptions = DefaultCommandOnPassOptions, owner: RenderActionOwner | null = null  ){
    this._afterRender.push( new BeforeRenderAction( callback, options, owner ) )
  }

  beforeSubmit( callback: BeforeRenderActionFunction, options : RenderActionOptions = DefaultCommandOnPassOptions, owner: RenderActionOwner | null = null  ){
    this._beforeSubmit.push( new BeforeRenderAction( callback, options, owner ) )
  }

  removeBeforeRender( callback: BeforeRenderActionFunction ){
    const idx = this._beforeRender.findIndex( a => a.action === callback )
    if( idx >= 0 ){
      this._beforeRender.splice( idx, 1 )
    }
  }

  removeAfterRender( callback: BeforeRenderActionFunction ){
    const idx = this._afterRender.findIndex( a => a.action === callback )
    if( idx >= 0 ){
      this._afterRender.splice( idx, 1 )
    }
  }

  removeBeforeSubmit( callback: BeforeRenderActionFunction ){
    const idx = this._beforeSubmit.findIndex( a => a.action === callback )
    if( idx >= 0 ){
      this._beforeSubmit.splice( idx, 1 )
    }
  }

  clearOwnerActions( owner: RenderActionOwner ){
    this._commands     = this._commands    .filter( a => a.owner !== owner )
    this._bundles      = this._bundles     .filter( a => a.owner !== owner )
    this._beforeRender = this._beforeRender.filter( a => a.owner !== owner )
    this._afterRender  = this._afterRender .filter( a => a.owner !== owner )
    this._beforeSubmit = this._beforeSubmit.filter( a => a.owner !== owner )
    this._rebuildActions = true
    this._sorted = false
  }

}
