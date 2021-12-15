import { GLContext } from "nanogl/types";
import TestDebugDraw from "./testDebugDraw";
import TestGui from './testGui';


export default class Tests {

  testDebugDraw: TestDebugDraw
  
  testGui: TestGui

  constructor( private gl : GLContext ){
    this.testDebugDraw = new TestDebugDraw( gl )
    this.testGui = new TestGui()
  }


  render(): void {
    this.testDebugDraw.render()
  }


}