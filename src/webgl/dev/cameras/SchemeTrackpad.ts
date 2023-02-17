import ControlScheme, { CameraMode } from "./ControlScheme";

/**
 * left mouse to orbit
 *  + shift : pan
 *  + alt  : dolly
 */
export default class SchemeTrackpad implements ControlScheme {
  inverseDolly = false;

  getModeForEvt(e: MouseEvent): CameraMode {
    if ((e.buttons & 1) == 0) return CameraMode.IDLE;

    if (e.shiftKey) {
      return e.altKey ? CameraMode.DOLLY : CameraMode.PAN;
    }
    return CameraMode.ORBIT;
  }
}