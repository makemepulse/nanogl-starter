import Lighting from "@webgl/engine/Lighting";


/// #if DEBUG
//*

const DevIblDir = "https://mmp-labs.s3.eu-west-1.amazonaws.com/resources/ibls"
import { loadJson } from "@webgl/resources/Net";
import gui from "./gui";


async function _addDevIbls( lighting : Lighting ):Promise<void> {
  
  const list = await loadJson( DevIblDir + '/list.json' )

  gui.folder('Lighting').select( 'ibls', list ).onChange( ibl=>{
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
