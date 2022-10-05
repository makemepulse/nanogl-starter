

import Ibl from 'nanogl-pbr/lighting/Ibl'



export default class IblLight extends Ibl {
  
  declare sh: Float32Array;

  private _ambientExposure = 1.0
  private _rawSH = new Float32Array(7*4)


  public setRawSH( sh:Float32Array ){
    this._rawSH = sh
    this.sh = new Float32Array(sh.length)
    this._scaleSh()
  }

  public get ambientExposure(): number {
    return this._ambientExposure
  }

  public set ambientExposure(value: number) {
    this._ambientExposure = value
    this._scaleSh()
  }

  private _scaleSh():void{
    if( !this.sh ) return
    const s = this._ambientExposure
    this.sh.set( this._rawSH.map(c=>c*s) )
  }

}

