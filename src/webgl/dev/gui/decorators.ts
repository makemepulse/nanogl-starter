/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NumberInputParams } from "tweakpane";
import gui from "."
import { Gui as GuiApi } from "./api";

type GuiOpts = {
  label?:string
  folder?:string
}

type PropertyDecoratorFunction = (target:any, propertyKey:string, opts?:GuiOpts)=>void
// type MethodDecoratorFunction = (target:any, propertyKey:string, descriptor:any, opts?:GuiOpts)=>void



const _folders = new Map<string,GuiApi>()

function getFolder( target : any, opts?:GuiOpts ): GuiApi {
  let id = target.constructor.__gui_group || ''

  if( opts && opts.folder){
    if( id !== '' ) id += '/'
    id += opts.folder
  }

  if( id !== '' ){
    let res = _folders.get( id )
    if( res === undefined ){
      res = gui.folder( id )
      _folders.set( id, res )
    }
    return res
  } 
  return gui
}

function createDecoratorWithInitFunction( fn: PropertyDecoratorFunction ){
  /// #if DEBUG
  return (target:any, propertyKey:string):void=>{
    
    let value : number;
    let isInit = false
    
    Object.defineProperty(target, propertyKey, {
      
      get(){
        return value;
      },
      
      set(newVal: number) {
        value = newVal;
        if( !isInit ){
          fn(target, propertyKey )
          isInit = true
        }
      }
      
    }); 
    
  }
  /// #else
  return ()=>{0}
  /// #endif
}


function ArglessPropertyDecorator(fn: PropertyDecoratorFunction, targetOrOpts?:any, name?:any): PropertyDecoratorFunction|void {
  const f = createDecoratorWithInitFunction( (_target:any, _propertyKey:string):void=>{
    fn(_target, _propertyKey, targetOrOpts )
  })

  if( targetOrOpts !== undefined && name !== undefined )
    f(targetOrOpts, name)
  else 
    return f
}


export function RangeGui( min:number, max: number, opts?:GuiOpts & NumberInputParams ){
  return createDecoratorWithInitFunction( (target:any, propertyKey:string):void=>{
    const ctrl = getFolder(target, opts).add(target, propertyKey, {min, max , ...opts} )
    if( opts?.label ) ctrl.setLabel( opts.label )
  })
}



export function ColorGui(target:any, name:any):void;
export function ColorGui(opts?:GuiOpts): PropertyDecoratorFunction;

export function ColorGui(target?:any, name?:any): PropertyDecoratorFunction|void {
  return ArglessPropertyDecorator( (_target:any, _propertyKey:string, opts?:GuiOpts):void=>{
    const ctrl = getFolder(_target, opts).addColor(_target, _propertyKey )
    if( opts?.label ) ctrl.setLabel( opts.label )
  }, target, name )
}


export function Monitor(target:any, name:any):void;
export function Monitor(opts?:GuiOpts): PropertyDecoratorFunction;

export function Monitor(target?:any, name?:any): PropertyDecoratorFunction|void {
  return ArglessPropertyDecorator( (_target:any, _propertyKey:string, opts?:GuiOpts):void=>{
    const ctrl = getFolder(_target, opts).monitor(_target, _propertyKey )
    if( opts?.label ) ctrl.setLabel( opts.label )
  }, target, name )
}



export function Gui(target:any, name:any):void;
export function Gui(opts?:GuiOpts): PropertyDecoratorFunction;

export function Gui(targetOrOpts?:any, name?:any): PropertyDecoratorFunction|void {
  return ArglessPropertyDecorator( (_target:any, _propertyKey:string, opts?:GuiOpts):void=>{
    getFolder(_target, opts).add(_target, _propertyKey, opts )
  }, targetOrOpts, name )
}


export function GuiFolder(name:string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (constructor: Function){
    (constructor as any)['__gui_group'] = name
  }
}