import Renderer from "@webgl/Renderer";
import { IScene } from "@webgl/engine/IScene";
import GuiTestObject from "./GuiTestObject";
import { GuiFolder } from "@webgl/dev/gui/decorators";


@GuiFolder('Gui Sample')
export default class GuiSample implements IScene {

  testGui: GuiTestObject;
  
  constructor( private renderer:Renderer ){
    this.testGui = new GuiTestObject()
  }
  
  
  unload(): void {
    this.testGui.dispose()
  }
  
  preRender(): void {
    this.testGui.preRender()
  }
  
 
 
  load() : Promise<void>{
    return Promise.resolve() 
  }

  render(): void {0}
  rttPass(): void {0}
}