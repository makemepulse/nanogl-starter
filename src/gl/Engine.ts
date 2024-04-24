import type { ActivityFactory } from "./core/Activity";
import type IActivity from "./core/Activity";
import CanvasTarget from "./core/CanvasTarget";
import Time from "./core/Time";
import DebugDraw from "./dev/debugDraw/DebugDraw";
import { TextureCodecs } from "./resources/TextureCodec";
import TextureCodecStd, { TextureCodecWebp } from "./resources/TextureCodecStd";


export type EngineOptions = {
  powerPreference?: GPUPowerPreference
}


TextureCodecs.registerCodec( new TextureCodecStd  () );
TextureCodecs.registerCodec( new TextureCodecWebp () );

export default class Engine {

  readonly canvasTarget: CanvasTarget;

  private _running = false;

  private _activities: IActivity[] = [];

  static async Create( opts?: EngineOptions ): Promise<Engine> {

    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }
    
    const adapter = await navigator.gpu.requestAdapter(opts);
    if (!adapter) {
      throw new Error("No appropriate GPUAdapter found.");
    }

    const device = await adapter.requestDevice();
    if (!device) {
      throw new Error("No appropriate GPUDevice found.");
    }

    console.log( device.limits )
    return new Engine( adapter, device );
  }


  private constructor( readonly adapter: GPUAdapter, readonly device: GPUDevice) {

    DebugDraw.init( device );
    this.canvasTarget = new CanvasTarget( document.getElementById('gl-canvas') as HTMLCanvasElement);
    this.canvasTarget.attach( this.device );
  }


  addActivity<T extends IActivity = IActivity>( factory: ActivityFactory<T> ): T {
    const activity = factory( this );
    this._loadAndPushActivity( activity );
    return activity;
  }

  /**
   * start render loop
   */
  start() {
    this._running = true;
    this._handleRaf();
  }

  /**
   * stop render loop
   */
  stop() {
    this._running = false;
  }


  render() {
    Time.enterFrame();
    for( const activity of this._activities ){
      activity.render();
    }
  }


  async _loadAndPushActivity( activity: IActivity ) {
    await activity.load();
    activity.start();
    this._activities.push( activity );
  }


  private _handleRaf = ()=>{
    if( !this._running ) return;
    requestAnimationFrame( this._handleRaf );
    this.render();
  }
  



  

}