
/// #if DEBUG
//*


import CameraManager from "@webgl/cameras/CameraManager"
import Cameras from "@webgl/cameras/Cameras"
import Renderer from "@webgl/Renderer"
import PerspectiveLens from "nanogl-camera/perspective-lens"
import MaxController from "./MaxController"



export function createMaxCamera( renderer:Renderer ): CameraManager<PerspectiveLens> {
  const devManager    = new CameraManager(Cameras.makeDefaultCamera())
  devManager.setControler( new MaxController(renderer.ilayer) )
  return devManager
}

export function createBlenderCamera( renderer:Renderer ): CameraManager<PerspectiveLens> {
  const devManager    = new CameraManager(Cameras.makeDefaultCamera())
  devManager.setControler( new MaxController(renderer.ilayer) )
  return devManager
}


/*/ 
/// #else

// production code here

/// #endif
//*/