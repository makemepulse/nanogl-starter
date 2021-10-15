/* eslint-disable @typescript-eslint/no-explicit-any */

import { ColorInputParams, FolderApi } from "@tweakpane/core";
import { InputBindingApi, NumberInputParams, Pane, TpChangeEvent } from "tweakpane";
import { Color, Control, Gui } from "./api";
import { VecColorInputPlugin } from "./plugins/tp-color";
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';


const root = new Pane()
root.registerPlugin( {plugin:VecColorInputPlugin} )
root.registerPlugin( EssentialsPlugin )

class TweakControl<T> implements Control<T>{

  _listeners: ((v:T)=>void)[] = []

  constructor( private input: InputBindingApi<unknown, T>, private getter: ()=>T ){
    input.on( 'change', (v:TpChangeEvent<T>)=>{
      this._listeners.forEach( l=>l(v.value) )
    })
  }

  valueOf(): T {
    return this.getter()
  }

  get value(): T {
    return this.getter()
  }

  onChange(cb: (v:T)=>void): void {
    this._listeners.push(cb)
  }

  setLabel( s:string ): void{
    this.input.label = s
  }

}


function _factory( pane : FolderApi ){
  
  const gui : Gui = {

    add<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key, min?: number, max?: number): Control<O[Key]> {
      const opts: NumberInputParams = { min, max };
      const ctrl = pane.addInput(tgt, prop, opts);
      return new TweakControl(ctrl, () => tgt[prop]);
    },
    
    
    addColor<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<Color> {
      const alpha = tgt[prop].length === 4
      const opts: ColorInputParams = {view:'color', alpha, picker: 'inline',};
      const ctrl = pane.addInput(tgt, prop, opts);
      return new TweakControl(ctrl, () => tgt[prop]);
    },

  
    btn(name: string, fn: (name?: string) => void): void {
      const btn = pane.addButton({
        title: name,
      });
      btn.on( 'click', ()=>{
        fn(name)
      })
    },
  

    folder(name:string): Gui {
      const folder = pane.addFolder({
        title:name,
        expanded: false
      })
      return _factory( folder )
    },

    reset():void {
      for (const c of pane.children) {
        pane.remove( c )
      }

      // if( pane !== root ){
      //   pane.dispose()
      // }
    }

    
  }

  return gui
  
}



const gui = _factory( root )


// ===================================================================
// FPS
// ===================================================================
const fpsGraph: any = root.addBlade({
  view: 'fpsgraph',
  label: 'fpsgraph',
  lineCount: 2,
});

function render() {
  fpsGraph.begin();
  fpsGraph.end();
  requestAnimationFrame(render);
}

render()


// ===================================================================
// Presistence
// ===================================================================

function LSSave(){
  const v = JSON.stringify(root.exportPreset(), null, 2)
  localStorage.setItem('gui-save', v )
}

function Export(){
  const v = JSON.stringify(root.exportPreset(), null, 2)
  console.log( v )
}

function LSLoad(){
  const v = localStorage.getItem('gui-save')
  if( v ){
    root.importPreset( JSON.parse(v))
  }
}

function LSClear(){
  localStorage.removeItem('gui-save')
}

const cells = [
  {title:'save', cbk:LSSave},
  {title:'load', cbk:LSLoad},
  {title:'clear', cbk:LSClear},
  {title:'export', cbk:Export},
]

const save:any = root.addBlade({
  view: 'buttongrid',
  size: [cells.length, 1],
  cells: (x:number) => cells[x],
  label: '',
})

save.on('click', (ev:any) => {
  cells[ev.index[0]].cbk()
});

setTimeout(LSLoad, 200)

root.addSeparator()


export default gui