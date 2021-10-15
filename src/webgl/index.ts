import './features'
import GLView from './GLView';
import Renderer from './Renderer';

import TestGui from './testGui';


new TestGui()

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

  glview: GLView
  renderer: Renderer

  private constructor() {

    const canvas = document.createElement( 'canvas' )

    this.glview = new GLView(canvas);
    this.renderer  = new Renderer( this.glview );
    
    this.glview.start()
  }

  /**
    Start loading assets
    @return a (when.js) promise 
  **/
  load(): Promise<void> {
    return Promise.resolve()
    // await this.scene.load();
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