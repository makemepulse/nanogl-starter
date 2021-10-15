/* eslint-disable @typescript-eslint/no-explicit-any */


export type GlslModule = {
  (o?:any):string
  onHmr : (l?:(s:GlslModule)=>void)=>void
  toString():string
}

declare module "*.glsl" {
    const value: GlslModule;
    export default value;
}

declare module "*.frag" {
    const value: GlslModule;
    export default value;
}

declare module "*.vert" {
    const value: GlslModule;
    export default value;
}

