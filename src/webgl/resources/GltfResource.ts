import { Resource } from "./Resource";
import { WebImpl } from "nanogl-gltf/lib/io/web";
import { GltfLoaderOptions } from "nanogl-gltf/lib/io/GltfLoaderOptions";
import { IGLContextProvider } from "./IGLContextProvider";
import GltfLoader from "nanogl-gltf/lib/io/GltfLoader";
import Gltf from "nanogl-gltf/lib/Gltf";
import WebglAssets from "./WebglAssets";
import IOInterface from "nanogl-gltf/lib/io/IOInterface";




class ModuleIO extends WebImpl {

  resolvePath(path: string, baseurl: string): string {
    
    if (this.isDataURI(path)) return path;
    if (baseurl !== undefined ){
      path =  baseurl + '/' + path;
    }
    console.log(`resolvePath ${path}`);
    return WebglAssets.getAssetPath(decodeURI(path))
  }
  
  
}

export const _stdIO = new WebImpl();
export const _moduleIO = new ModuleIO();


export default class GltfResource extends Resource<Gltf>{

  private readonly _io : IOInterface

  get gltf(): Gltf {
    return this.value
  }

  constructor(protected request: string, protected glp: IGLContextProvider, protected opts: GltfLoaderOptions = {}, useModuleIO = true) {
    super()
    this._io = useModuleIO ? _moduleIO : _stdIO;
  }


  async doLoad(): Promise<Gltf> {
    console.log('req', this.request);
    
    const loader = new GltfLoader( this._io, this.request, {
      ...this.opts,
      abortSignal: this.abortSignal
    });

    const gltf = await loader.load();
    await gltf.allocate(this.glp.gl)
    return gltf
  }

  doUnload(): void {
    0
  }




}
