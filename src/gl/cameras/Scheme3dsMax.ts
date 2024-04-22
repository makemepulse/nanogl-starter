import ControlScheme, { CameraMode } from "./ControlScheme";

/**
 * middle mouse to pan
 *  + alt : orbit
 *  + ctrl-alt  : dolly
 */
export default class Scheme3dsMax implements ControlScheme {
  
  inverseDolly = false
  
  getModeForEvt( e:PointerEvent ) : CameraMode {
    // discard non primary pointer
    if( !e.isPrimary ) return CameraMode.IDLE

    // for mouse control, use only left or middle button
    if( e.pointerType == "mouse" && (e.buttons & 5) == 0 ) return CameraMode.IDLE;

    if( e.altKey ){
      return e.ctrlKey ? CameraMode.DOLLY : CameraMode.ORBIT
    }

    return CameraMode.PAN;
  }

}
