import IRenderer from "@webgl/core/IRenderer";
import TestDebugDraw from "./testDebugDraw";


export default class Tests {

  testDebugDraw: TestDebugDraw
  constructor( private renderer : IRenderer ){
    this.testDebugDraw = new TestDebugDraw( renderer )
  }


  render(): void {
    this.testDebugDraw.render()
  }


}