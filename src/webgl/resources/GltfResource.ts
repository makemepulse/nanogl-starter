import { Resource } from "./Resource";
import { WebImpl } from "nanogl-gltf/lib/io/web";
import { GltfLoaderOptions } from "nanogl-gltf/lib/io/GltfLoaderOptions";
import { IGLContextProvider } from "./IGLContextProvider";
import GltfLoader from "nanogl-gltf/lib/io/GltfLoader";
import Gltf from "nanogl-gltf/lib/Gltf";
import WebglAssets from "./WebglAssets";




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

  get gltf(): Gltf {
    return this.value
  }

  constructor(protected request: string, protected glp: IGLContextProvider, protected opts: GltfLoaderOptions = {}) {
    super()
  }


  async doLoad(): Promise<Gltf> {
    console.log('req', this.request);
    
    const loader = new GltfLoader(_moduleIO, this.request, {
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
