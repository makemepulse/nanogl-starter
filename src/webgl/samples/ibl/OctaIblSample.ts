import IblResource from "@webgl/resources/IblResource";
import IblBaseSample from "./IblBaseSample";

/**
 * Force loading of OCTA ibl format, to compare it to PMREM
 */
export default class OctaIblSample extends IblBaseSample {

  loadIbl(): Promise<void> {
    return new IblResource({

      path: 'ibls/Harbour_2',
      ibl: this.lighting.ibl,
      useAssetDatabase: true,
      forceOctahedronFormat: true

    }, this.gl).load().then()
  }

}