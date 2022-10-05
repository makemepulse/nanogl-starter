import IblResource from "@webgl/resources/IblResource";
import IblBaseSample from "./IblBaseSample";


export default class PmremIblSample extends IblBaseSample {

  loadIbl(): Promise<void> {
    return new IblResource({
      path:'ibl/Harbour_2',
      useAssetDatabase: true,
      ibl: this.lighting.ibl
    }, this.gl).load().then()
  }

}