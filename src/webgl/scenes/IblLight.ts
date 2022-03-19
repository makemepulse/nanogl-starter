

import Ibl from 'nanogl-pbr/lighting/Ibl'
import Texture2D from 'nanogl/texture-2d';
import { GLContext } from 'nanogl/types';
import { loadBytes, loadImage } from '@webgl/resources/Net';


export default class IblLight extends Ibl {

  private _ambientExposure = 1.0
  private _rawSH = new Float32Array(9*3)

  sh: Float32Array;

  public get ambientExposure(): number {
    return this._ambientExposure
  }

  public set ambientExposure(value: number) {
    this._ambientExposure = value
    this._updateSh()
  }

  constructor( gl:GLContext ){
    super( new Texture2D( gl, gl.RGBA, gl.UNSIGNED_BYTE ), new Float32Array(7*4) )
  }


  async load( envPath:string, shPath:string ): Promise<void> {

    const img = await loadImage( envPath )
    this.env.fromImage( img )

    const shData = await loadBytes( shPath )
    this._rawSH = new Float32Array(shData, 0, 9*3);
    this._updateSh()
  }


  private _updateSh():void{
    this.sh.set( Ibl.convert(this._rawSH, this.ambientExposure ) )
  }

}
