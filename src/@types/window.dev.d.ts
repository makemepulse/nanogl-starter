/* eslint-disable @typescript-eslint/no-explicit-any */


declare global {
  interface Dev {
    textureUsage: ()=>void 
  }
  interface Window { 
    dev:Partial<Dev>
  }
}

export {}