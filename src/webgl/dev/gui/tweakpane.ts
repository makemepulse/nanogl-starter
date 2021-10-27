/* eslint-disable @typescript-eslint/no-explicit-any */

import { ColorInputParams, FolderApi, ListItem } from "@tweakpane/core";
import { InputBindingApi, ListApi, NumberInputParams, Pane } from "tweakpane";
import { Color, Control, Gui } from "./api";
import { VecColorInputPlugin } from "./plugins/tp-color";
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
// import * as TweakpaneThumbnailListPlugin from 'tweakpane-plugin-thumbnail-list'
// import { Thumbnail } from "tweakpane-plugin-thumbnail-list/src/controller";


const root = new Pane()

root.registerPlugin( {plugin:VecColorInputPlugin} )
root.registerPlugin( EssentialsPlugin )
// root.registerPlugin( TweakpaneThumbnailListPlugin )


type ControlInput<T> = InputBindingApi<unknown, T> | ListApi<T>

class TweakControl<T> implements Control<T>{

  _listeners: ((v:T)=>void)[] = []

  constructor( private input: ControlInput<T>, private getter: ()=>T ){
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    input.on( 'change', (v:any)=>{
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
  const _folders = new Map<string,Gui>()

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
    

    addSelect<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key, options:Record<string, O[Key]> | O[Key][]): Control<O[Key]> {
      const ctrl = gui.select( prop, options )
      ctrl.onChange( v=>tgt[prop]=v)
      return ctrl
    },
    
    
  
    btn(name: string, fn: (name?: string) => void): void {
      const btn = pane.addButton({
        title: name,
      });
      btn.on( 'click', ()=>{
        fn(name)
      })
    },
    
    btns( btns:Record<string, (name?:string)=>void> ): void {

      const cells = Object.entries(btns).map( v=>({title:v[0], cbk:v[1]}))
      const grid:any = pane.addBlade({
        view: 'buttongrid',
        size: [cells.length, 1],
        cells: (x:number) => cells[x],
        label: '',
      })

      grid.on('click', (ev:any) => {
        cells[ev.index[0]].cbk()
      });

    },


    select<T>( label: string, o: Record<string, T> | T[]/*, thumbnailResolver?: (v:T)=>string*/ ):Control<T>{
      
      let options : ListItem<T>[]

      if( Array.isArray(o)){
        options = o.map( v=>({text:String(v), value:v }))
      } else {
        options = Object.entries(o).map( e=>({text:e[0], value:e[1] }))
      }

      // const useThumbnail = ( thumbnailResolver !== undefined )

      // if( useThumbnail ){
      //   options.forEach( o=>{
      //     (o as any as Thumbnail).src = thumbnailResolver(o.value)
      //   })
      // }

      // const target = {
      //   prop: options[0].value
      // }

      // const list = pane.addInput(target, 'prop', {
      //   view: useThumbnail?'thumbnail-list':'list',
      //   options
      // }) 
      const list:ListApi<T> = pane.addBlade({
        // view: useThumbnail?'thumbnail-list':'list',
        view: 'list',
        label,
        options,
        value: options[0].value,
      }) as ListApi<T>;

      
      return new TweakControl(list, () => list.value );
    },
  

    folder(name:string): Gui {
      let folder = _folders.get( name );
      if( !folder ){
        folder = _factory( pane.addFolder({
          title:name,
          expanded: false
        }))
        _folders.set( name, folder )
      }
      return folder
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

// setTimeout(LSLoad, 200)

root.addSeparator()


export default gui
