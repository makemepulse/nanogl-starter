import LiveShader from "@webgl/core/LiveShader";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import FragModule from './disolve_fx.frag'

/**
 * this shader can be edited live and hot reloaded in place
 */
const FragCode = LiveShader(FragModule)



/**
 * Chunk which inject code to dsicard frament based on simplex noise sampling and threshold 
 */
export default class DisolveFX extends Chunk {
  
  scale: Input;
  threshold: Input;

  constructor(){
    super(true, false)

    // add 2 inputs for the effect parameters
    // as child of this chunk
    this.addChild( this.scale = new Input('DisolveScale', 1, ShaderType.VERTEX) )
    this.addChild( this.threshold = new Input('DisolveThreshold', 1) )

    // initialize these input with constant values
    this.scale.attachConstant(1)
    this.threshold.attachConstant(.1)

    /**
     * ivalidate this chunk's code when live reloading the glsl module
     * noop in production release
     */
    FragCode.onHmr(()=>this.invalidateCode())
    
  }
  
  
  protected _genCode(slots: ChunksSlots): void {
    /**
     * add code in various places in the initial passes (see disolve_fx.frag)
     */
    slots.add('pv'   , FragCode({slot:'pv'   }))
    slots.add('postv', FragCode({slot:'postv'}))
    slots.add('pf'   , FragCode({slot:'pf'   }))
    slots.add('f'    , FragCode({slot:'f'    }))
  }
}