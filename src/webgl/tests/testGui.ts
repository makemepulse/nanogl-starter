import gui from "../dev/gui"
import { Gui, RangeGui, GuiBtn, GuiFolder } from "../dev/gui/decorators"

@GuiFolder('Tests')
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
  
  // @ColorGui
  // someColor = vec4.fromValues(1, 0, 0, 1)
  

  @GuiBtn
  testButton():void{
    console.log('youhou');
  }

  constructor(){
    gui.folder('Tests').add( this, 'skipRender' )
  }


}