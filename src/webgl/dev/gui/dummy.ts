/* eslint-disable @typescript-eslint/no-explicit-any */

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

}


function _factory(){

  const gui : Gui = {
    add<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      return new DummyControl(tgt[prop]);
    },
    
    addColor<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<Color> {
      return new DummyControl(tgt[prop]);
    },
    
    addSelect<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
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

    reset() {
      0;
    },

    select: function <T>(): Control<T> {
      return new DummyControl(null);
    }
  }

  return gui
  
}


const gui = _factory()
export default gui