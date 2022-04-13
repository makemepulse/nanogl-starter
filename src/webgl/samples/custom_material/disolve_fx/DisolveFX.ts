import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import Frag from './disolve_fx.frag'

export default class DisolveFX extends Chunk {
  
  scale: Input;
  threshold: Input;
  
  constructor(){
    super(true, false)
    
    this.addChild( this.scale = new Input('DisolveScale', 1, ShaderType.VERTEX) )
    this.addChild( this.threshold = new Input('DisolveThreshold', 1) )
    this.scale.attachConstant(1)
    this.threshold.attachConstant(.1)
    
  }
  
  protected _genCode(slots: ChunksSlots): void {
    slots.add('pv', Frag({slot:'pv'}))
    slots.add('postv', Frag({slot:'postv'}))
    slots.add('pf', Frag({slot:'pf'}))
    slots.add('f', Frag({slot:'f'}))
  }
}