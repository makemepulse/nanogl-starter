
// no easing, no acceleration
export function linear (t:number):number { return t };

// accelerating from zero velocity
export function easeInQuad (t:number):number { return t*t };

// decelerating to zero velocity
export function easeOutQuad (t:number):number { return t*(2-t) };

// acceleration until halfway, then deceleration
export function easeInOutQuad (t:number):number { return t<.5 ? 2*t*t : -1+(4-2*t)*t };

// accelerating from zero velocity 
export function easeInCubic (t:number):number { return t*t*t };

// decelerating to zero velocity 
export function easeOutCubic (t:number):number { return (--t)*t*t+1 };

// acceleration until halfway, then deceleration 
export function easeInOutCubic (t:number):number { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 };

// accelerating from zero velocity 
export function easeInQuart (t:number):number { return t*t*t*t };

// decelerating to zero velocity 
export function easeOutQuart (t:number):number { return 1-(--t)*t*t*t };

// acceleration until halfway, then deceleration
export function easeInOutQuart (t:number):number { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t };

// accelerating from zero velocity
export function easeInQuint (t:number):number { return t*t*t*t*t };

// decelerating to zero velocity
export function easeOutQuint (t:number):number { return 1+(--t)*t*t*t*t };

// acceleration until halfway, then deceleration 
export function easeInOutQuint (t:number):number { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t };


export function easeInExpo  (t:number):number { return Math.pow( 2, 10 * (t - 1) ); };


export function easeOutExpo  (t:number):number { return -Math.pow( 2, -10 * t ) + 1; };


export function easeInOutExpo  (t:number):number {
  t *= 2.0;
  return (t < 1.0) ? .5 * Math.pow( 2, 10 * (t - 1) ) : .5 * ( -Math.pow( 2, -10 * (--t)) + 2 );
};




