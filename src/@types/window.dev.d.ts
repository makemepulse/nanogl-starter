/* eslint-disable @typescript-eslint/no-explicit-any */


declare global {
  interface Dev {
    textureProfile: ()=>void 
  }
  interface Window { 
    dev:Partial<Dev>
  }
}

export {}