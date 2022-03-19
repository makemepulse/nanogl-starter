/* eslint-disable @typescript-eslint/no-explicit-any */

import { ColorInputParams, FolderApi, ListItem, MonitorBindingApi } from "@tweakpane/core";
import { InputBindingApi, ListApi, NumberInputParams, Pane } from "tweakpane";
import { Color, Control, Gui } from "./api";
import { VecColorInputPlugin } from "./plugins/tp-color";
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import {RadioGridBladeParams} from '@tweakpane/plugin-essentials/dist/types/radio-grid/blade-plugin'
import * as TweakpaneRotationInputPlugin from '@0b5vr/tweakpane-plugin-rotation'
import { quat } from "gl-matrix";
// import * as TweakpaneThumbnailListPlugin from 'tweakpane-plugin-thumbnail-list'
// import { Thumbnail } from "tweakpane-plugin-thumbnail-list/src/controller";

class QuatWrapper {
  constructor(public q:quat){}

  get x(){return this.q[0]}
  set x(v:number){this.q[0]=v}

  get y(){return this.q[1]}
  set y(v:number){this.q[1]=v}

  get z(){return this.q[2]}
  set z(v:number){this.q[2]=v}

  get w(){return this.q[3]}
  set w(v:number){this.q[3]=v}
}

const root = new Pane()

root.registerPlugin( {plugin:VecColorInputPlugin} )
root.registerPlugin( EssentialsPlugin )
root.registerPlugin( TweakpaneRotationInputPlugin )
// root.registerPlugin( TweakpaneThumbnailListPlugin )

const _controlsByTarget = new WeakMap<any, Control<any>[]>()

function registerCtrl( target:any, ctrl:Control<any> ){
  let l  = _controlsByTarget.get(target)
  if( !l ){
    l = []
    _controlsByTarget.set(target, l)
  }
  l.push(ctrl)
}

type ControlInput<T> = InputBindingApi<unknown, T> | ListApi<T> | MonitorBindingApi<T>

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

  remove(): void {
    this.input.dispose()
  }

}

type RadioItem<T> = {
  title:string,value:T
}

type TPGui = Gui & {
  _getPane():FolderApi
  _createFolder(name:string):TPGui
}


function _factory( pane : FolderApi ){

  const _folders = new Map<string,TPGui>()

  function createFoldersRecursivly( dirs:string[]):TPGui {
    let cgui = gui;
    for (const fname of dirs) {
      if( fname !== '')
        cgui = cgui._createFolder(fname) as TPGui
    }
    return cgui
  }


  function resolvePath( label:string ):{gui:TPGui, label:string }{
    const a = label.split('/')
    if( a.length===1){
      return {gui, label}
    } else {
      label = a.pop()
      const gui = createFoldersRecursivly(a)
      return {gui, label }
    }
  }


  const gui : TPGui = {

    add<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key, min?: number, max?: number): Control<O[Key]> {
      const opts: NumberInputParams = { min, max };
      const input = pane.addInput(tgt, prop, opts);
      const ctrl = new TweakControl(input, () => tgt[prop]);
      registerCtrl( tgt, ctrl )
      return ctrl
    },


    monitor<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      const input = pane.addMonitor(tgt, prop);
      const ctrl = new TweakControl(input, () => tgt[prop]);
      registerCtrl( tgt, ctrl )
      return ctrl
    },
    
    
    addColor<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<Color> {
      const alpha = tgt[prop].length === 4
      const opts: ColorInputParams = {view:'color', alpha, picker: 'inline',};
      const input = pane.addInput(tgt, prop, opts);
      const ctrl = new TweakControl(input, () => tgt[prop]);
      registerCtrl( tgt, ctrl )
      return ctrl
    },

    addRotation<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<quat> {
      const r = tgt[prop]
      const o = {[prop]:new QuatWrapper(r)}
      // const o = {q:{x:r[0],y:r[1],z:r[2],w:r[3]}}
      const input = pane.addInput(o, prop, {
        view: 'rotation',
        rotationMode: 'quaternion', // optional, 'quaternion' by default
        picker: 'inline', // or 'popup'. optional, 'popup' by default
        expanded: true, // optional, false by default
      })
      const ctrl = new TweakControl<quat>(input, () => tgt[prop]);
      registerCtrl( tgt, ctrl )
      return ctrl
    },
    

    addSelect<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key, options:Record<string, O[Key]> | O[Key][]): Control<O[Key]> {
      const ctrl = gui.select( prop, options )
      ctrl.onChange( v=>tgt[prop]=v)
      registerCtrl( tgt, ctrl )
      return ctrl
    },
    
    
    addRadios<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key, options:O[Key][]): Control<O[Key]> {
      const ctrl = gui.radios( prop, options )
      ctrl.onChange( v=>tgt[prop]=v)
      registerCtrl( tgt, ctrl )
      return ctrl
    },

  
    btn(name: string, fn: (name?: string) => void): void {
      const {label:title, gui} = resolvePath(name)
      const btn = gui._getPane().addButton({title});
      btn.on( 'click', ()=>fn(title))
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



    select<T>( name: string, o: Record<string, T> | T[]/*, thumbnailResolver?: (v:T)=>string*/ ):Control<T>{
      
      const {label, gui} = resolvePath(name)
      let options : ListItem<T>[]

      if( Array.isArray(o)){
        options = o.map( v=>({text:String(v), value:v }))
      } else {
        options = Object.entries(o).map( e=>({text:e[0], value:e[1] }))
      }

      const list:ListApi<T> = gui._getPane().addBlade({
        // view: useThumbnail?'thumbnail-list':'list',
        view: 'list',
        label,
        options,
        value: options[0].value,
      }) as ListApi<T>;

      
      return new TweakControl(list, () => list.value );
    },
  



    radios<T>( name: string, o: Record<string, T> | T[]/*, thumbnailResolver?: (v:T)=>string*/ ):Control<T>{
      
      const {label, gui} = resolvePath(name)
      let options : RadioItem<T>[]

      if( Array.isArray(o)){
        options = o.map( v=>({title:String(v), value:v }))
      } else {
        options = Object.entries(o).map( e=>({title:e[0], value:e[1] }))
      }

      const params : RadioGridBladeParams<T> = {
        view: 'radiogrid',
        cells: (x:number) => options[x],
        groupName:label,
        size: [options.length, 1],
        label,
        options,
        value: options[0].value,
      }
      const list:ListApi<T> = gui._getPane().addBlade(params) as ListApi<T>;

      return new TweakControl(list, () => list.value );
    },
  

    folder(name:string): TPGui {
      return createFoldersRecursivly(name.split('/') )
    },

    clearTarget(tgt:any): void {
      const ctrls = _controlsByTarget.get(tgt)
      if( ctrls ){
        ctrls.forEach( ctrl=>ctrl.remove() )
        _controlsByTarget.delete(tgt)
      }
    },

    clearFolder(name:string): void {
      const folder = _folders.get( name );
      folder?.clear()
    },

    clear():void {
      for (const c of pane.children) {
        pane.remove( c )
      }
    },


    _createFolder(name:string): TPGui {

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

    
    _getPane():FolderApi {
      return pane
    },
    
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
