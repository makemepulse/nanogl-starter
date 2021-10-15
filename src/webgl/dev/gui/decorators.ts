/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import gui from "."
import { Gui } from "./api";

type GuiOpts = {
  label?:string
}

type PropertyDecoratorFunction = (target:any, propertyKey:string, opts?:GuiOpts)=>void



const _folders = new Map<string,Gui>()

function getFolder( target : any ): Gui {
  const id = target.constructor.__gui_group
  if( id ){
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


export function RangeGui( min:number, max: number, opts?:GuiOpts ){
  return createDecoratorWithInitFunction( (target:any, propertyKey:string):void=>{
    const ctrl = getFolder(target).add(target, propertyKey, min, max )
    if( opts?.label ) ctrl.setLabel( opts.label )
  })
}



export function ColorGui(target:any, name:any):void;
export function ColorGui(opts?:GuiOpts): PropertyDecoratorFunction;

export function ColorGui(target?:any, name?:any): PropertyDecoratorFunction|void {
  return ArglessPropertyDecorator( (_target:any, _propertyKey:string, opts?:GuiOpts):void=>{
    const ctrl = getFolder(_target).addColor(_target, _propertyKey )
    if( opts?.label ) ctrl.setLabel( opts.label )
  }, target, name )
}



export function Gui(target:any, name:any):void;
export function Gui(opts?:GuiOpts): PropertyDecoratorFunction;

export function Gui(targetOrOpts?:any, name?:any): PropertyDecoratorFunction|void {
  return ArglessPropertyDecorator( (_target:any, _propertyKey:string, opts?:GuiOpts):void=>{
    const ctrl = getFolder(_target).add(_target, _propertyKey )
    if( opts?.label ) ctrl.setLabel( opts.label )

  }, targetOrOpts, name )
}


export function GuiBtn(target:any, name:any, descriptor:any){
  gui.btn( name, descriptor.value )
}

export function GuiFolder(name:string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (constructor: Function){
    (constructor as any)['__gui_group'] = name
  }
}