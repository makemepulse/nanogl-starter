
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';
import { ITextureInfo, BaseTextureInfo } from './TextureInfo';


export default class NormalTextureInfo extends BaseTextureInfo implements IElement, ITextureInfo {

  readonly gltftype : GltfTypes.NORMAL_TEXTURE_INFO = GltfTypes.NORMAL_TEXTURE_INFO;
  
  scale: number;

  async parse( gltfLoader:GltfLoader, data: Gltf2.IMaterialNormalTextureInfo ) : Promise<any>{
    await super.parse( gltfLoader, data );
    this.scale = data.scale ?? 1.0;
  }

}

