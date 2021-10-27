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
  addSelect<O extends Record<string, any>, Key extends string>( tgt:O, prop:Key, options:Record<string, O[Key]> | O[Key][] ):Control<O[Key]>;
  
  btn( name: string, fn:(name?:string)=>void ): void;
  btns( btns:Record<string, (name?:string)=>void> ): void;
  select<T>( label: string, o: Record<string, T> | T[]/*, thumbnailResolver?: (v:T)=>string*/ ):Control<T>;

  folder( name: string ): Gui;


  reset():void;
}
