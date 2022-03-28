
import Delay from "@/core/Delay"
import gui from "@webgl/dev/gui"
import { Monitor } from "@webgl/dev/gui/decorators"
import Program from "nanogl/program"
import { GLContext } from "nanogl/types"
import { IScene } from "./IScene"
import DebugDrawScene from "./DebugDraw"
import RobotScene from "./robot"
import SuzanneScene from "./suzane"

const Scenes = {
  robot: RobotScene,
  suzanne: SuzanneScene,
  debugdraw: DebugDrawScene,
}

export default class SceneSelector {

  private _current: IScene | null

  public get current(): IScene | null {
    return this._current
  }


  constructor(private gl:GLContext){

    Program.debug = true;
    this._setScene(new SuzanneScene(gl))
    gui.select( 'scene', Scenes ).onChange( v=> this._setScene(new v(gl)) )
    gui.btn( 'memTest', ()=> this.memTest() )
    
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


  @Monitor
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
        await this._setScene(this.current?null:new SuzanneScene(this.gl))
        this._memTestCount = this._memTestCount+1
      }
      await Delay(250)
    }

  }
  /// #endif

}