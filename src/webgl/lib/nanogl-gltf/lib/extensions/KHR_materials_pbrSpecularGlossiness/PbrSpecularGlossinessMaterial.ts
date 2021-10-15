import Material from "../../elements/Material";
import PbrSpecularGlossiness from "./PbrSpecularGlossiness";
import GltfLoader from "../../io/GltfLoader";
import Gltf2 from "../../types/Gltf2";


export default class PbrSpecularGlossinessMaterial extends Material {
  
  pbrSpecularGlossiness: PbrSpecularGlossiness;

  async parsePbrInputsData( gltfLoader: GltfLoader, data: Gltf2.IMaterial ) : Promise<any>{
    const pbrSpecGlossData = data.extensions['KHR_materials_pbrSpecularGlossiness']
    this.pbrInputsData = this.pbrSpecularGlossiness = new PbrSpecularGlossiness()
    await this.pbrSpecularGlossiness.parse(gltfLoader, pbrSpecGlossData );
  }

}