import { Resource } from "./Resource";
import Gltf from "@webgl/lib/nanogl-gltf/lib";
import { WebImpl } from "@webgl/lib/nanogl-gltf/lib/io/web";
import { GltfLoaderOptions } from "@webgl/lib/nanogl-gltf/lib/io/GltfLoaderOptions";
import { IGLContextProvider } from "./IGLContextProvider";
import GltfLoader from "@webgl/lib/nanogl-gltf/lib/io/GltfLoader";



export const IOImpl = new WebImpl();


export default class GltfResource extends Resource<Gltf>{
  
  get gltf(): Gltf {
    return this.value
  }
  
  constructor(protected request: string, protected glp: IGLContextProvider, protected opts : GltfLoaderOptions = {}) {
    super()
  }
  
  
  async doLoad(): Promise<Gltf> {
    const loader = new GltfLoader( IOImpl, this.request, this.opts );
    const gltf = await loader.load();
    await gltf.allocateGl(this.glp.gl)
    return gltf
  }

  doUnload(): void {
    0
  }

  


}