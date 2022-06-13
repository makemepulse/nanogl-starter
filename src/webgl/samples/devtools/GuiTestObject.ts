import { vec4 } from "gl-matrix"
import { Gui, RangeGui, GuiFolder, ColorGui, CreateGui, DeleteGui, Monitor, GuiBtn } from "../../dev/gui/decorators"

@GuiFolder('Gui Test Object')
export default class GuiTestObject {

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
  
  @Monitor()
  monitored = 0
  
  constructor(){
    CreateGui(this).open()
  }
  
  dispose():void {
    DeleteGui(this)
  }
  
  
  @GuiBtn
  testButton1():void{
    console.log('btn 1');
    console.log(this.p0, this.p1, this.someFlags)
  }
  
  @GuiBtn
  testButton2():void{
    console.log('btn 2');
  }
  

  preRender():void {
    this.monitored = Math.sin( performance.now()/1000 )
  }

}