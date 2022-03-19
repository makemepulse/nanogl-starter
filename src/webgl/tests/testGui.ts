import { vec4 } from "gl-matrix"
import gui from "../dev/gui"
import { Gui, RangeGui, GuiBtn, GuiFolder, ColorGui } from "../dev/gui/decorators"

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
  
  
  @GuiBtn
  testButton():void{
    console.log('youhou');
  }
  
  
  
  @RangeGui(0, 20, {folder:'subfolder', label:"custom label"})
  p0 = 0

  @Gui({folder:'subfolder'})
  p1 = true
  
  @ColorGui({folder:'subfolder', label:"color"})
  p2 = vec4.fromValues(1, 0, 0, 1)
  
  

  constructor(){
    gui.folder('Tests').add( this, 'skipRender' )
  }


}