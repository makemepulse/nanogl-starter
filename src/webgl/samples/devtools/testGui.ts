import { vec4 } from "gl-matrix"
import gui from "../../dev/gui"
import { Gui, RangeGui, GuiFolder, ColorGui } from "../../dev/gui/decorators"

@GuiFolder('Tests GUI')
export default class TestGui{

  ilayer    : HTMLElement
  root      : Node


  skipRender = false

  @Gui
  someFlags = false

  @Gui()
  someOtherFlags = false

  @RangeGui(0, 20)
  test = 12
  
  @ColorGui
  someColor = vec4.fromValues(1, 0, 0, 1)
  
  
  
  
  @RangeGui(0, 20, {folder:'subfolder', label:"custom label"})
  p0 = 0
  
  @Gui({folder:'subfolder'})
  p1 = true
  
  @ColorGui({folder:'subfolder', label:"color"})
  p2 = vec4.fromValues(1, 0, 0, 1)
  
  
  
  constructor(){
    const f = gui.folder('Tests GUI')
    f.add( this, 'skipRender' )
    f.btn( 'testButton1', ()=>{ this.testButton1() } )
    f.btn( 'testButton2', ()=>{ this.testButton2() } )
  }
  
  dispose():void {
    gui.clearTarget(this)
    gui.clearFolder('Tests GUI')
  }
  
  testButton1():void{
    console.log('btn 1');
  }
  
  testButton2():void{
    console.log('btn 2');
  }
  

}