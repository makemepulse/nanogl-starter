import { GlslModule } from "@/@types/glsl"
import Capabilities from "@webgl/core/Capabilities"
import Program from "nanogl/program"
import { GLContext } from "nanogl/types"

const _modules = require.context( './', true, /shader\.(vert|frag)$/i )


type ProgramSource = {
  id:string, 
  vert:GlslModule, 
  frag:GlslModule
}

const _sources: ProgramSource[] = []


function getPair( id:string ): ProgramSource {
  let res = _sources.find( p=>p.id === id )
  if( res === undefined ){
    res = {
      id, vert:null, frag: null
    }
    _sources.push( res )
  }
  return res
}


_modules.keys().forEach( k=>{

  const filepath = k.substring(2, k.length)
  const programId = filepath.split('/')[0]
  
  const pair = getPair(programId)

  if( filepath.endsWith( 'frag' ) ){
    pair.frag = _modules(k)
  } else {
    pair.vert = _modules(k)
  }
})


for (const pair of _sources) {

  if( pair.vert === null ){
    throw `Program ${pair.id} missing vertex shader`
  }

  if( pair.frag === null ){
    throw `Program ${pair.id} missing fragment shader`
  }
  
}



type PrecisionEnum = 'lowp' | 'mediump' | 'highp'

export default class Programs {

  private _programs: Map<string, Program>;

  bestPrecision : PrecisionEnum = 'lowp'

  constructor( private gl:GLContext ){

    this.bestPrecision = Capabilities.hasHighpPrecision( gl ) ? 'highp' : (Capabilities.hasMediumpPrecision( gl ) ? 'mediump':  'lowp' )

    this._programs = new Map()

    for (const source of _sources) {
      const p = new Program( gl, source.vert(this), source.frag(this) )
      this._programs.set( source.id, p )
    }
  }


  get( id:string):Program {
    return this._programs.get( id )
  }

}

