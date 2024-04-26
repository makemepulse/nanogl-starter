
export type RenderActionOptions = {
  priority?: number
}

export const DefaultCommandOnPassOptions : Readonly<RenderActionOptions> = {
  priority: 0
}

export type RenderActionContext = {

}


export type BeforeRenderActionFunction = ( context: RenderActionContext ) => void
export type AddCommandsActionFunction = ( passEncoder: GPURenderPassEncoder, context: RenderActionContext ) => void
export type AddBundleActionFunction = ( passEncoder: GPURenderBundleEncoder, context: RenderActionContext ) => void


interface RenderAction {
  readonly priority: number

  execute( passEncoder: GPURenderPassEncoder, context: RenderActionContext ):void;
}



class AddBundleAction implements RenderAction {

  readonly priority : number;

  private _bundle: GPURenderBundle | null = null

  constructor( readonly func: AddBundleActionFunction, readonly options: RenderActionOptions ){
    this.priority = options.priority ?? 0
    this.func = func
  }

  // invalidate(){
  //   this._bundle = null
  // }

  encode( encoder: GPURenderBundleEncoder, context: RenderActionContext ): void {
    this.func( encoder, context ) 
    this._bundle = encoder.finish()
  }

  execute( passEncoder: GPURenderPassEncoder ){
    passEncoder.executeBundles( [this._bundle!] )
  }

}


class AddCommandsAction implements RenderAction {

  readonly priority : number;

  constructor( readonly func: AddCommandsActionFunction, readonly options: RenderActionOptions ){
    this.priority = options.priority ?? 0
  }

  execute( passEncoder: GPURenderPassEncoder, context: RenderActionContext ){
    this.func( passEncoder, context )
  }

}

class BeforeRenderAction {

  constructor( readonly func: BeforeRenderActionFunction ){

  }

  execute( context: RenderActionContext ){
    this.func( context )
  }

}



export default class RenderActions {

  private _beforeRender: BeforeRenderAction[] = []
  private _actions: RenderAction[] = []
  private _bundles: AddBundleAction[] = []
  private _pendingBundles: AddBundleAction[] = []

  private _sorted = false

  getRenderActions(): RenderAction[] {
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

  encodePendingBundles( encoder: GPURenderBundleEncoder, context: RenderActionContext ){
    if(  this._pendingBundles.length === 0 ) return;

    for( const action of this._pendingBundles ){
      action.encode( encoder, context )
    }
    this._actions.push( ...this._pendingBundles )
    this._bundles.push( ...this._pendingBundles )
    this._pendingBundles = []
    this._sorted = false
  }
  
  executeBeforeRenderActions( context: RenderActionContext ){
    for( const action of this._beforeRender ){
      action.execute( context )
    }
  }

  
  addCommands( callback: AddCommandsActionFunction, options : RenderActionOptions = DefaultCommandOnPassOptions ){
    const action = new AddCommandsAction( callback, options )
    this._actions.push( action )
    this._sorted = false
  }
  
  addBundle( callback: AddBundleActionFunction, options : RenderActionOptions = DefaultCommandOnPassOptions ){
    const action = new AddBundleAction( callback, options )
    this._actions.push( action )
    this._pendingBundles.push( action )
    this._sorted = false
  }

  beforeRender( callback: BeforeRenderActionFunction ){
    this._beforeRender.push( new BeforeRenderAction( callback ) )
  }



}
