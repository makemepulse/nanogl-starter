import ControlScheme, { CameraMode } from "./ControlScheme";

/**
 * middle mouse to orbit
 *  + shift : pan
 *  + ctrl-shift  : dolly
 */
export default class SchemeBlender implements ControlScheme {
  
  inverseDolly = true

  getModeForEvt( e:PointerEvent ) : CameraMode {
    
    // discard non primary pointer
    if( !e.isPrimary ) return CameraMode.IDLE

    // for mouse control, use only left or middle button
    if( e.pointerType == "mouse" && (e.buttons & 5) == 0 ) return CameraMode.IDLE;

    if( e.shiftKey ){
      return e.ctrlKey ? CameraMode.DOLLY : CameraMode.PAN
    }
    return CameraMode.ORBIT;
  }

}
