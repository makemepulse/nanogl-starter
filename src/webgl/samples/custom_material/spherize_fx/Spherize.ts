import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";


import VertModule from './spherize.vert'


export default class Spherize extends Chunk {

  radius: Input
  amount: Input
  center: Input

  private _worldSpaceDeformation = false;
  public get worldSpaceDeformation() {
    return this._worldSpaceDeformation;
  }
  public set worldSpaceDeformation(value) {
    if( this._worldSpaceDeformation != value ){
      this._worldSpaceDeformation = value;
      this.invalidateCode()
    }
  }

  constructor(){
    super(true, false)

    this.addChild( this.radius = new Input('spherizeRadius', 1, ShaderType.VERTEX ) )
    this.addChild( this.amount = new Input('spherizeAmount', 1, ShaderType.VERTEX ) )
    this.addChild( this.center = new Input('spherizeCenter', 3, ShaderType.VERTEX ) )

    this.radius.attachConstant(1)
    this.amount.attachConstant(.5)
    this.center.attachConstant([0, 0, 0])

  }

  protected _genCode(slots: ChunksSlots): void {
    // depending on the world space deformation flag, 
    // inject code at a different stage of the vertex shader
    // and modify a different variable
    const slot = this._worldSpaceDeformation ? 'vertex_warp_world' : 'vertex_warp'
    const positionExpression = this._worldSpaceDeformation ? 'vertex.worldPos' : 'vertex.position'
    slots.add(slot, VertModule({positionExpression}))
  }

}