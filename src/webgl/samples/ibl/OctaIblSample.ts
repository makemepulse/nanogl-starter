import IblResource from "@webgl/resources/IblResource";
import IblBaseSample from "./IblBaseSample";


export default class OctaIblSample extends IblBaseSample {

  loadIbl(): Promise<void> {
    return new IblResource({
      path: 'ibl/Harbour_2',
      useAssetDatabase: true,
      ibl: this.lighting.ibl,
      forceOctahedronFormat: true
    }, this.gl).load().then()
  }

}