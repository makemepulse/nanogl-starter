

/// #if DEBUG
//*

const DevIblDir = "https://mmp-labs.s3.eu-west-1.amazonaws.com/resources/ibls"
import { loadJson } from "@webgl/resources/Net";
import Lighting from "@webgl/scenes/Lighting";
import gui from "./gui";

// function thumbnailResolver( dir:string ) : string {
//   return `${DevIblDir}/${dir}/thumb.jpg`
// }

async function _addDevIbls( lighting : Lighting ):Promise<void> {
  
  const list = await loadJson( DevIblDir + '/list.json' )

  gui.folder('lighting').select( 'ibls', list ).onChange( ibl=>{
    const env = `${DevIblDir}/${ibl}/env.png`
    const sh = `${DevIblDir}/${ibl}/sh.bin`
    lighting.ibl.load( env, sh )
  })

}

/*/ 
/// #else
function _addDevIbls():void {}
/// #endif
//*/

export default function addDevIbls( lighting : Lighting ):void {
  _addDevIbls(lighting)
}
