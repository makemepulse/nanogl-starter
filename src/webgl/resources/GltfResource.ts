import { Resource } from "./Resource";
import { WebImpl } from "@webgl/lib/nanogl-gltf/lib/io/web";
import { GltfLoaderOptions } from "@webgl/lib/nanogl-gltf/lib/io/GltfLoaderOptions";
import { IGLContextProvider } from "./IGLContextProvider";
import GltfLoader from "@webgl/lib/nanogl-gltf/lib/io/GltfLoader";
import Gltf from "@webgl/lib/nanogl-gltf/lib/Gltf";


export const IOImpl = new WebImpl();


export default class GltfResource extends Resource<Gltf>{

  get gltf(): Gltf {
    return this.value
  }
  
  constructor(protected request: string, protected glp: IGLContextProvider, protected opts : GltfLoaderOptions = {}) {
    super()
  }
  
  
  async doLoad(): Promise<Gltf> {
    
    const loader = new GltfLoader( IOImpl, this.request, {
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
