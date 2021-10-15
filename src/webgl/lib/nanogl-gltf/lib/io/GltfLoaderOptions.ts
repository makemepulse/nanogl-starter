import { IExtensionFactory } from "../extensions/IExtension"
import { AbortSignal } from "@azure/abort-controller"



type Options = {

  baseurl : string
  /**
   * per loader additional extensions
   * Extensions are merged with global extensions
   */
  extensions : IExtensionFactory[]

  abortSignal : AbortSignal
  
}

export type GltfLoaderOptions = Partial<Options>