import IRenderer from "@webgl/core/IRenderer";
import TestDebugDraw from "./testDebugDraw";
import TestGui from './testGui';


export default class Tests {

  testDebugDraw: TestDebugDraw
  
  testGui: TestGui

  constructor( private renderer : IRenderer ){
    this.testDebugDraw = new TestDebugDraw( renderer )
    this.testGui = new TestGui()
  }


  render(): void {
    this.testDebugDraw.render()
  }


}