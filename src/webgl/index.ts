import './features'
import GLView from './GLView';
import Renderer from './Renderer';


/**
  @opts :

    REQUIRED:
    'canvas'    {HTMLCanvasElement}   :  context free canvas element in which scene will be rendered
    'subtitles' {HTMLElement}         :  a dom element in which subtitles will be innerHTML-ed
    'config'    {string}              :  url to the xml config file 
    'assetsUrl' {string}              :  3D assets base url without trailing slash
    'model'     {Model}               :  Model instance shared with the page

    OPTIONAL:
    'ilayer'    {HTMLElement}         :  dom elemnt on which touch/mouse event are listened, default to canvas element 
    'quality'   {string}              :  enum 'auto', 'hi' or 'low'

**/
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
    return this.renderer.load();
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
  // module.hot.dispose(data => {
  //   gui.reset()
  // });
}

/// #endif