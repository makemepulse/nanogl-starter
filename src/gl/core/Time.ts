
let _dt = 1/60
let _time = -1


/**
 * TODO: not static , create an instance in renderer instead
 */
const Time = {

  get dt(): number {
    return _dt
  },

  get milliseconds(): number {
    return _time
  },

  get seconds(): number {
    return _time / 1000
  },

  enterFrame():void {
    const now = performance.now()
    const delta = now - _time
    
    if( _time > 0 ){
      _dt = delta/1000
      _dt = Math.min( 1/5, _dt )
    }

    _time = now
  }

}

export default Time
