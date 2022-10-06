import IblResource from "@webgl/resources/IblResource";
import IblBaseSample from "./IblBaseSample";

/**
 * Load an Ibls the standard way, using PMREM in webgl2 OCTA otherwise
 */
export default class PmremIblSample extends IblBaseSample {

  loadIbl(): Promise<void> {
    return new IblResource({
      path:'ibls/Harbour_2',
      // pmremMipLevels: 7,
      useAssetDatabase: true,
      ibl: this.lighting.ibl
    }, this.gl).load().then()
  }

}