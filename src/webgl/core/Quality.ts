import { throwIfAborted } from "@/core/AbortSignalUtils";
import Deferred from "@/core/Deferred";
import Delay from "@/core/Delay";
import Signal from "@/core/Signal";
import { AbortSignal } from "@azure/abort-controller";
import gui from "@webgl/dev/gui";



type FPSMonitorResult = {
  meanFrame: number
}


function pnow() {
  return performance.now() / 1000
}

class FPSMonitor {



  private _running = false
  private lastFrameTime = -1
  private startTime = -1
  private _sampleDuration = 1

  private record: number[] = []

  private _defer: Deferred<FPSMonitorResult>


  start(duration = 1): Promise<FPSMonitorResult> {
    if (this._running) return;
    this._sampleDuration = duration;
    this._defer = new Deferred()
    this.startTime = pnow();
    this._running = true;
    requestAnimationFrame(this.onRaf)
    return this._defer.promise;
  }

  stop() {
    if (!this._running) return
    this._running = false
    this._defer.reject("stopped")
    this._stop()
  }

  _stop() {
    this._defer = null
    this._running = false
    this.record.length = 0
  }

  onRaf = () => {
    if (!this._running) return;

    const now = pnow();
    if (this.lastFrameTime > 0) {
      this.record.push(now - this.lastFrameTime);
    }
    this.lastFrameTime = now;

    if (now - this.startTime > this._sampleDuration) {
      this._defer.resolve(this.getResult());
      this._stop();
      return;
    }

    requestAnimationFrame(this.onRaf)
  }


  getResult(): FPSMonitorResult {
    let rawmean = 0;
    const record = this.record
    for (let i = 0; i < record.length; i++) {
      const f = record[i];
      rawmean += f
    }
    rawmean /= record.length;


    let mean = 0;
    let c = 0;
    for (let i = 0; i < record.length; i++) {
      const f = record[i];
      const delta = f / rawmean
      if (delta > .25 && delta < 4) {
        mean += f
        c++
      }
    }

    mean /= c;

    return {
      meanFrame: mean
    }
  }

}


const FPS_TARGET = 50
/**
 * time in ms before starting monitring fps and adjuste quality
 * to accomodate initial lags
 */
const WARMUP_DELAY = 1500

/**
 * delay to wait before monitor fps again after quaity drop
 */
const POST_DEGRADE_DELAY = 200



export default class Quality<TLevel> {

  setLevel(level: number) {
    this.levelIndex = level
  }

  readonly onChange = new Signal<TLevel>()

  _currentLevel: number;

  
  
  /// #if DEBUG

  private _forceQuality = false;

  public get forceQuality() {
    return this._forceQuality;
  }
  public set forceQuality(value) {
    if(value === this._forceQuality) return;
    this._forceQuality = value;
    this._applyLevel()
  }


  private _debugLevel: number;

  public get debugLevel() {
    return this._debugLevel;
  }

  public set debugLevel(value) {
    if (value === this._debugLevel) return;
    this._debugLevel = value;
    this._forceQuality = true;
    this._applyLevel()
  }
  /// #endif



  constructor(readonly levels: TLevel[]) {
    this.levelIndex = levels.length - 1

    /// #if DEBUG
    this._debugLevel = this._currentLevel
    const f = gui.folder("Quality")
    f.add(this, "forceQuality", { label: "force quality level" })
    f.add(this, "debugLevel", { min: 0, max: levels.length-1, step: 1, label: "quality" })
    /// #endif
  }


  async startAutoLevel(signal: AbortSignal) {

    this._applyLevel()

    const monitor = new FPSMonitor();
    const targetFrame = 1 / FPS_TARGET

    await Delay(WARMUP_DELAY)

    // eslint-disable-next-line no-constant-condition
    while (true) {

      const res = await monitor.start()
      throwIfAborted(signal)

      console.log(`fps ${1 / res.meanFrame}`);

      if (res.meanFrame > targetFrame) {
        if (!this.degrade()) return;
        await Delay(POST_DEGRADE_DELAY)
      } else {
        return;
      }
    }
  }


  private set levelIndex(l: number) {
    if (l < 0 || l >= this.levels.length) return;
    this._currentLevel = l;
    this._applyLevel()
  }


  private get levelIndex() {
    return this._currentLevel
  }


  get level(): TLevel {
    /// #if DEBUG
    if (this._forceQuality) {
      return this.levels[Math.round(this._debugLevel)]
    }
    /// #endif

    return this.levels[this._currentLevel]
  }


  public improve() {
    if (this.levelIndex >= this.levels.length - 1) return false
    this.levelIndex++;
    return true;
  }

  public degrade() {
    if (this.levelIndex <= 0) return false
    this.levelIndex--;
    return true;
  }


  private _applyLevel() {
    this.onChange.emit(this.level)
  }

}