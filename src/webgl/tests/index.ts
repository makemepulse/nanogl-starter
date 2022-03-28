import { GLContext } from "nanogl/types";
import TestGui from './testGui';


export default class Tests {

  
  testGui: TestGui

  constructor( private gl : GLContext ){
    this.testGui = new TestGui()
  }




}