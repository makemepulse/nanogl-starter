
/// #if DEBUG
//*

import CameraManager from "@webgl/cameras/CameraManager"
import Cameras from "@webgl/cameras/Cameras"
import Renderer from "@webgl/Renderer"
import PerspectiveLens from "nanogl-camera/perspective-lens"
import ControlScheme from "./ControlScheme"
import DevCameraController from "./DevCameraController"
import Scheme3dsMax from "./Scheme3dsMax"
import SchemeBlender from "./SchemeBlender"


function getSchemeFromEnvVar():ControlScheme {
  switch (process.env.VUE_APP_DEV_CAMERA_SCHEME) {
    case undefined: 
    case '3ds': return new Scheme3dsMax()
    case 'blender': return new SchemeBlender()
  }
  console.warn(`Unknown camera scheme: ${process.env.VUE_APP_DEV_CAMERA_SCHEME}`)
}

export function createDevCamera( renderer:Renderer ): CameraManager<PerspectiveLens> {
  const ctrl = new DevCameraController( renderer.ilayer )
  ctrl.controlScheme = getSchemeFromEnvVar()
  const devManager    = new CameraManager(Cameras.makeDefaultCamera())
  devManager.setControler( ctrl )
  return devManager
}

/*/ 
/// #else

// production code here

/// #endif
//*/