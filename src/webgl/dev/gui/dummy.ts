/* eslint-disable @typescript-eslint/no-explicit-any */

import { quat } from "gl-matrix";
import { Color, Control, Gui } from "./api";



class DummyControl<T> implements Control<T>{

  constructor( private _value: T){}
  
  setLabel(s: string): void {
    s
  }
  
  valueOf(): T {
    return this._value
  }
  
  get value(): T {
    return this._value
  }

  onChange(): void {0;}
  remove(): void {0;}

}


function _factory(){

  const gui : Gui = {
    add<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      return new DummyControl(tgt[prop]);
    },
  
    monitor<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      return new DummyControl(tgt[prop]);
    },
    
    addColor<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<Color> {
      return new DummyControl(tgt[prop]);
    },

    addRotation<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<quat>  {
      return new DummyControl(tgt[prop]);
    },
    
    addSelect<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      return new DummyControl(tgt[prop]);
    },

    addRadios<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      return new DummyControl(tgt[prop]);
    },

    btn(): void {
      0;
    },
    
    btns(): void {
      0;
    },

    folder(): Gui {
      return gui;
    },

    clear() {
      0;
    },

    clearTarget(): void {
      0;
    },
    
    clearFolder(): void {
      0;
    },

    select: function <T>(): Control<T> {
      return new DummyControl(null);
    },

    radios: function <T>(): Control<T> {
      return new DummyControl(null);
    }
    
  }

  return gui
  
}


const gui = _factory()
export default gui