
let dt = 1/60
let time = -1



const Time = {

  get dt(): number {
    return dt
  },

  get time(): number {
    return time
  },

  enterFrame():void {
    const now = performance.now()
    const delta = now - time
    
    if( time > 0 ){
      dt = delta/1000
      dt = Math.min( 1/5, dt )
    }

    time = now
  }

}

export default Time
