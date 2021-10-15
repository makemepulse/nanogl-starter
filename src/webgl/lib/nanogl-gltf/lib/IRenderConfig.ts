

export default interface IRenderConfig {
  opaqueMask : number
  blendedMask : number
}

export function DefaultRenderConfig(){
  return {
    opaqueMask : 1<<0,
    blendedMask : 1<<1,
  }
}
