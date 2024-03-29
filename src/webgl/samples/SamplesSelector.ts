
import Delay from "@/core/Delay"
import gui from "@webgl/dev/gui"
import { Monitor } from "@webgl/dev/gui/decorators"
import { IScene } from "../engine/IScene"
import RobotScene from "./robot"
import SimpleGltfSample from "./gltfs/SimpleGltfSample"
import AdamScene from "./adam"
import Renderer from "@webgl/Renderer"


import LightsScene              from "./lights"
import RttSample                from "./rtt/RttSample"
import MsaaSample               from "./rtt/MsaaSample"
import PickFloorSample          from "./interactions/PickFloorSample"
import GuiSample                from "./devtools/GuiSample"
import DevtoolsScene            from "./devtools/DebugDrawSample"
import CancellationSample       from "./resources/CancellationSample"
import TexturesSample           from "./resources/TexturesSample"
import ReourceGroupSample       from "./resources/ResourceGroupSample"
import TextureCubeSample        from "./resources/TextureCubeSample"
import MinimalResourceSample    from "./resources/MinimalResourceSample"
import BasisSample              from "./resources/BasisSample"
import ClearcoatSample          from "./custom_material/ClearcoatSample"
import DisolveSample            from "./custom_material/DisolveSample"
import MatcapSample             from "./custom_material/MatcapSample"
import SpherizeSample           from "./custom_material/SpherizeSample"
import UnlitSample              from "./custom_material/UnlitSample"
import LightmapSample           from "./custom_material/LightmapSample"
import MinimalDrawcallSample    from "./lowlevel/MinimalDrawcallSample"
import GLStateSample            from "./lowlevel/GLStateSample"
import SkyboxSample             from "./lowlevel/SkyboxSample"
import PmremIblSample           from "./ibl/PmremIblSample"
import OctaIblSample            from "./ibl/OctaIblSample"
import SpherePrimitiveSample    from "./lowlevel/SpherePrimitiveSample"
import PackshotSample           from "./gltfs/PackshotSample"
import TexturesAllFormatsSample from "./resources/TexturesAllFormatsSample"



export const SampleScenes = {
  'Gltf - Adam'                  : AdamScene                ,
  'Gltf - Robot'                 : RobotScene               ,
  'Gltf - Suzanne'               : SimpleGltfSample         ,
  'Gltf - Packshot'              : PackshotSample           ,
  'Materials - Clearcoat'        : ClearcoatSample          ,
  'Materials - Disolve'          : DisolveSample            ,
  'Materials - Spherize'         : SpherizeSample           ,
  'Materials - Matcap'           : MatcapSample             ,
  'Materials - Lightmap'         : LightmapSample           ,
  'Materials - Unlit'            : UnlitSample              ,
  'Devtools - DebugDraw'         : DevtoolsScene            ,
  'Devtools - Gui'               : GuiSample                ,
  'Ibl - Webgl2 (Pmrem)'         : PmremIblSample           ,
  'Ibl - Webgl1 (Octa)'          : OctaIblSample            ,
  'RTT - Basic'                  : RttSample                ,
  'RTT - Msaa'                   : MsaaSample               ,
  'Low Level - Drawcall'         : MinimalDrawcallSample    ,
  'Low Level - GL State'         : GLStateSample            ,
  'Low Level - Skybox'           : SkyboxSample             ,
  'Low Level - Sphere Primitive' : SpherePrimitiveSample    ,
  'Resources - Minimal'          : MinimalResourceSample    ,
  'Resources - Cancellation'     : CancellationSample       ,
  'Resources - Groups'           : ReourceGroupSample       ,
  'Resources - Textures'         : TexturesSample           ,
  'Resources - Cubemaps'         : TextureCubeSample        ,
  'Resources - Basis'            : BasisSample              ,
  'Resources - AllFormats'       : TexturesAllFormatsSample ,
  'Pointers - Picking'           : PickFloorSample          ,
  'Lights'                       : LightsScene              ,
} as const


export type SceneTypes = keyof typeof SampleScenes



export default class SamplesSelector {

  private _current: IScene | null

  public get current(): IScene | null {
    return this._current
  }


  constructor( private renderer:Renderer ){
    
    // const sn = decodeURI(window.location.hash.substring(1)) as SceneTypes
    // const Scene = SampleScenes[sn] || ClearcoatSample
    
    // this._setScene(new Scene(renderer))

    const f = gui.folder("Samples")
    f.select( 'scene', SampleScenes ).onChange( v=>{
      for (const key in SampleScenes) {
        if(SampleScenes[key as SceneTypes] === v){
          window.location.hash = key
          break
        }
      }
      this._current?.unload()
      this._current = null
      this._setScene(new v(renderer)) 
    })
    
    f.btn( 'memTest', ()=> this.memTest() )
    f.open()
  }
  
  async setScene( sceneName:SceneTypes ):Promise<void>{
    this._current?.unload()
    this._current = null
    const scene = new SampleScenes[sceneName]( this.renderer )
    return this._setScene(scene)
  }

  private async _setScene( scene:IScene ):Promise<void>{
    if( scene ){
      await scene.load()
      this._current = scene
    }
  }


  /// #if DEBUG
  private _memTestRunning = false


  @Monitor({folder:'Samples'})
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
        await this._setScene(this.current?null:new SimpleGltfSample(this.renderer))
        this._memTestCount = this._memTestCount+1
      }
      await Delay(250)
    }

  }
  /// #endif

}