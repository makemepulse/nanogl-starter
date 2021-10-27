

type GlslModule = {
  (o?:unknown):string
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

