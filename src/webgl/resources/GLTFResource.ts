import { Resource } from "./Resource";
import Gltf from "@webgl/lib/nanogl-gltf/lib";
import WebGltfIO from "@webgl/lib/nanogl-gltf/lib/io/web";
import { GltfLoaderOptions } from "@webgl/lib/nanogl-gltf/lib/io/GltfLoaderOptions";
import { IGLContextProvider } from "./IGLContextProvider";

export default class GLTFResource extends Resource<Gltf>{
  
  
  constructor(private request: string, private glp: IGLContextProvider, private opts : GltfLoaderOptions = {}) {
    super()
    this.request = request
    this.opts = opts
  }
  
  async doLoad(): Promise<Gltf> {
    const gltf = await WebGltfIO.loadGltf(this.request, this.opts)
    await gltf.allocateGl(this.glp.gl)
    return gltf
  }


  doUnload(): void {
    0
  }

}