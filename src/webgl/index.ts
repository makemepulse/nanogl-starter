import './features'
import GLView from './GLView';
import Renderer from './Renderer';

export default class GLApp {

  private static _instance: GLApp | null = null

  static getInstance(): GLApp {
    if( this._instance === null ){
      this._instance = new GLApp()

    }
    return this._instance
  }

  readonly glview: GLView
  readonly renderer: Renderer

  private constructor() {

    const canvas = document.createElement( 'canvas' )

    this.glview = new GLView(canvas);
    this.renderer  = new Renderer( this.glview );
  }

  
  load(): Promise<void> {
    return Promise.resolve()
  }

  start():void {
    this.glview.start()
  }

  stop():void {
    this.glview.stop()
  }



}


/// #if DEBUG

if (module.hot) {
  module.hot.decline()
}

/// #endif