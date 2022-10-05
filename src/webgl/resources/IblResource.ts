import { Resource } from "./Resource";
import { WebImpl } from "nanogl-gltf/lib/io/web";
import AssetDatabase from "./AssetDatabase";
import IOInterface from "nanogl-gltf/lib/io/IOInterface";
import { GLContext, isWebgl2 } from "nanogl/types";
import IblLight from "@webgl/engine/IblLight";
import { cubeFaceForSurface, FaceIndex } from "./TextureData";
import { TextureCubeResource, TextureResource } from "./TextureResource";
import { loadText } from "./Net";
import nativeAbortSignal from "@/core/AbortSignalUtils";


export type IblRequest = {

  /**
   * directory containing the IBL bundle, 
   * If bundle is in AssetDatabase set useAssetDatabase to true 
   * 
   */
  path: string

  /**
   * existing ibl to setup, if not provided a new one will be created
   */
  ibl?: IblLight

  /**
   * Force octa format even if pmrem is available
   * @default false
   */
  forceOctahedronFormat?: boolean;

  /**
   * Assume assets are in AssetDatabase
   * @default false
   */
  useAssetDatabase?: boolean

}

class ModuleIO extends WebImpl {

  resolvePath(path: string, baseurl: string): string {
    if (this.isDataURI(path)) return path;
    if (baseurl !== undefined) {
      path = baseurl + '/' + path;
    }
    return AssetDatabase.getAssetPath(decodeURI(path))
  }

}


const PMREM_MIPLEVELS = 5

export const _stdIO = new WebImpl();
export const _moduleIO = new ModuleIO();


export default class IblResource extends Resource<IblLight>{

  private readonly _io: IOInterface

  private _usePmrem = false

  private _bundlePath: string = null

  private _useAssetDatabase = false
  
  private _ibl: IblLight = null

  get usePmrem() {
    return this._usePmrem
  }

  get ibl(): IblLight {
    return this._ibl
  }

  constructor(protected request: IblRequest, protected gl: GLContext) {
    super()

    this._bundlePath = request.path
    if (this._bundlePath.endsWith('/')) {
      this._bundlePath = this._bundlePath.slice(0, -1)
    }

    this._useAssetDatabase = request.useAssetDatabase ?? false

    this._usePmrem = isWebgl2(gl) && (request.forceOctahedronFormat !== true)

    this._ibl = request.ibl || new IblLight()
    
    this._ibl.iblFormat   = this._usePmrem ? 'PMREM' : 'OCTA'
    this._ibl.shFormat    = 'SH9'
    this._ibl.hdrEncoding = 'RGBM'
  }


  async doLoad(): Promise<IblLight> {

    await Promise.all( [
      this._doLoadEnv(),
      this._doLoadSh()
    ])

    return this._ibl
  }
  
  doUnload(): void {
    0
  }
  
  
  private async _doLoadEnv(): Promise<void> {
    if( this._usePmrem ){
      await this._loadPmrem()
    } else {
      await this._loadOctahedron()
    }
  }


  private async _doLoadSh(): Promise<void> {
    const shFile = await loadText( this.resolveBundlePath('sh.txt'), {signal: nativeAbortSignal(this._abortCtrl.signal)} )
    this._ibl.setRawSH( decodeSHFile( shFile ) )
  }

  /**
   * Resolve rgbm png resource name in the bundle. 
   * eg : "m1.rgbm.png" -> "base/dir/m1.rgbm.png"
   * @param filename 
   * @returns 
   */
  private resolveBundlePath(name: string): string {
    const filename = `${this._bundlePath}/${name}`
    if (this._useAssetDatabase)
      return AssetDatabase.getAssetPath(filename)
    else
      return filename
  }

  /**
   * create list of filenames to load a pmremcubmap
   */
  private createPmremFilenames(mips = 5, ext = ""): string[] {
    const faces = ['px', 'py', 'pz', 'nx', 'ny', 'nz']

    const res: string[] = []
    for (let mip = 0; mip < mips; mip++) {
      for (const face of faces) {
        res.push( `m${mip}_${face}.rgbm.png${ext}` )
      }
    }
    return res.map( s=>this.resolveBundlePath(s))
  }




  /**
   * load a 256x pmrem cubemap with 5 mip levels
   * @param dir 
   * @param mips 
   */
  private async _loadPmrem(): Promise<void> {

    

    const pmremRes = new TextureCubeResource({
      sources: [
        {codec: 'webp', lods: [{files: this.createPmremFilenames(PMREM_MIPLEVELS, '.webp')}]},
        {codec: 'std' , lods: [{files: this.createPmremFilenames(PMREM_MIPLEVELS         )}]},
      ]
    }, this.gl, {
      alpha: true,
    })


    const pmremTex = await pmremRes.load( this.abortSignal )

    const gl = this.gl;
    /*
      Add missing miplevels

      uploaded
      dim 256, 128, 64, 32, 16
      lvl   0,  1,  2,  3,  4

      missing
      dim  8, 4, 2, 1
      lvl  5, 6, 7, 8
    */

    for (let i = 0; i < 6; i++) {
      for (let level = 5; level < 9; level++) {
        const size = 1 << (8 - level)
        const faceTarget = cubeFaceForSurface(i as FaceIndex);
        this.gl.texImage2D(faceTarget, level, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
    }

    pmremTex.setFilter(true, true, true)
    this._ibl.env = pmremTex
    
  }
  
  
  private async _loadOctahedron(): Promise<void> {

    
    const octaRes = new TextureResource({
      sources: [
        {codec: 'webp', lods: [{files: [this.resolveBundlePath('octa.rgbm.png.webp')]}]},
        {codec: 'std' , lods: [{files: [this.resolveBundlePath('octa.rgbm.png'     )]}]},
      ]
    }, this.gl, {
      alpha: true,
    })

    this._ibl.env = await octaRes.load( this.abortSignal )
  }





}





/**
 * decode a sh file
 * format :
( 0.252204805612564,  0.272126317024231,  0.322363495826721); // L00, irradiance, pre-scaled base
( 0.030555875971913,  0.077282063663006,  0.139420628547668); // L1-1, irradiance, pre-scaled base
(-0.062728792428970, -0.059055190533400, -0.056063398718834); // L10, irradiance, pre-scaled base
( 0.145342752337456,  0.117357067763805,  0.086221456527710); // L11, irradiance, pre-scaled base
( 0.041684538125992,  0.046409677714109,  0.047313917428255); // L2-2, irradiance, pre-scaled base
(-0.022586036473513, -0.033206179738045, -0.042016692459583); // L2-1, irradiance, pre-scaled base
(-0.014718639664352, -0.012121702544391, -0.011940266937017); // L20, irradiance, pre-scaled base
(-0.076393768191338, -0.053162343800068, -0.034820139408112); // L21, irradiance, pre-scaled base
( 0.072380885481834,  0.053305134177208,  0.031383275985718); // L22, irradiance, pre-scaled base
 */
function decodeSHFile(shFile: string):Float32Array{
  const lines = shFile.split('\n')
  const sh = new Float32Array(9*3)
  for( let i=0; i<9; i++ ){
    const line = lines[i]
    const m = line.match(/\((.*),(.*),(.*)\)/)
    sh[i*3+0] = parseFloat(m[1])
    sh[i*3+1] = parseFloat(m[2])
    sh[i*3+2] = parseFloat(m[3])
  }
  return sh

}

