
import Delay from "@/core/Delay"
import gui from "@webgl/dev/gui"
import { Monitor } from "@webgl/dev/gui/decorators"
import Program from "nanogl/program"
import { IScene } from "../engine/IScene"
import RobotScene from "./robot"
import SuzanneScene from "./suzane"
import AdamScene from "./adam"
import Renderer from "@webgl/Renderer"
import ResourcesScene from "./resources"
import DevtoolsScene from "./devtools"
import TexturesScene from "./textures"
import LightsScene from "./lights"

const Scenes = {
  adam     : AdamScene     ,
  robot    : RobotScene    ,
  suzanne  : SuzanneScene  ,
  devtools : DevtoolsScene ,
  resources: ResourcesScene,
  textures : TexturesScene ,
  lights   : LightsScene   ,
}

export default class SamplesSelector {

  private _current: IScene | null

  public get current(): IScene | null {
    return this._current
  }


  constructor( private renderer:Renderer ){

    // this._setScene(new AdamScene(gl))
    // this._setScene(new SuzanneScene(renderer))
    // this._setScene(new TexturesScene(renderer))
    this._setScene(new LightsScene(renderer))

    const f = gui.folder("Scenes")
    f.select( 'scene', Scenes ).onChange( v=>{
      this._current?.unload()
      this._current = null
      this._setScene(new v(renderer)) 
    })
    
    f.btn( 'memTest', ()=> this.memTest() )
    
  }
  
  private async _setScene( scene:IScene ):Promise<void>{
    this._current?.unload()
    this._current = null
    if( scene ){
      await scene.load()
      Program.debug = true;
      this._current = scene
    }
  }


  /// #if DEBUG
  private _memTestRunning = false


  @Monitor({folder:'Scenes'})
  private _memTestCount = 0
  
  async memTest():Promise<void>{
    
    if( this._memTestRunning ) {
      this._memTestRunning = false
      return
    }

    this._memTestRunning = true
    // eslint-disable-next-line no-constant-condition
    while(true){
      if( this.current ){
        await this._setScene(null)
        if( !this._memTestRunning ) break
      } else {
        await this._setScene(this.current?null:new SuzanneScene(this.renderer))
        this._memTestCount = this._memTestCount+1
      }
      await Delay(250)
    }

  }
  /// #endif

}