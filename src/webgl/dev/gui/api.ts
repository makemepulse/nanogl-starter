/* eslint-disable @typescript-eslint/no-explicit-any */
import { vec3, vec4 } from "gl-matrix";

export type Color = vec3|vec4

export interface Control<T = any> {
  value: T
  onChange( cb: (v:T)=>void ):void
  setLabel( s:string ): void
}

export interface Gui {
  
  add<O extends Record<string, any>, Key extends string>( tgt:O, prop:Key ):Control<O[Key]>;
  add<O extends Record<string, any>, Key extends string>( tgt:O, prop:Key, min:number, max:number ):Control<O[Key]>;
  addColor<O extends Record<string, any>, Key extends string>( tgt:O, prop:Key ):Control<Color>;
  
  btn( name: string, fn:(name?:string)=>void ): void;

  folder( name: string ): Gui;

  reset():void;
}
