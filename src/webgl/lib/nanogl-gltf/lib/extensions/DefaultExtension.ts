import { IExtensionInstance, IExtensionFactory } from "./IExtension";
import GltfLoader from "../io/GltfLoader";

import Animation            from "../elements/Animation"            ;
import AnimationChannel     from "../elements/AnimationChannel"     ;
import AnimationSampler     from "../elements/AnimationSampler"     ;
import Accessor             from "../elements/Accessor"             ;
import Camera               from "../elements/Camera"               ;
import Material             from "../elements/Material"             ;
import Mesh                 from "../elements/Mesh"                 ;
import NormalTextureInfo    from "../elements/NormalTextureInfo"    ;
import OcclusionTextureInfo from "../elements/OcclusionTextureInfo" ;
import PbrMetallicRoughness from "../elements/PbrMetallicRoughness" ;
import Primitive            from "../elements/Primitive"            ;
import Sampler              from "../elements/Sampler"              ;
import Scene                from "../elements/Scene"                ;
import Skin                 from "../elements/Skin"                 ;
import Texture              from "../elements/Texture"              ;
import TextureInfo          from "../elements/TextureInfo"          ;
import Node                 from "../elements/Node"                 ;
import Image                from "../elements/Image"                ;
import Gltf from "..";
import Gltf2 from "../types/Gltf2";
import { ElementOfType, PropertyType, AnyElement } from "../types/Elements";
import GltfTypes from "../types/GltfTypes";
import Asset from "../elements/Asset";
import Buffer from "../elements/Buffer";
import BufferView from "../elements/BufferView";
import AccessorSparse from "../elements/AccessorSparse";
import AccessorSparseIndices from "../elements/AccessorSparseIndices";
import AccessorSparseValues from "../elements/AccessorSparseValues";



class DefaultExtensionInstance implements IExtensionInstance {

  readonly name: 'default' = 'default';

  readonly priority: number = 0;

  readonly loader: GltfLoader;
  
  constructor(gltfLoader: GltfLoader){
    this.loader = gltfLoader;
  }


  acceptElement<P extends Gltf2.Property>(data: P, element: ElementOfType<PropertyType<P>> ) : null | Promise<ElementOfType<PropertyType<P>>> {
    return null;
  }


  loadElement<P extends Gltf2.Property>(data: P): Promise<ElementOfType<PropertyType<P>>>;
  loadElement(data: Gltf2.Property): Promise<AnyElement> {
    
    switch (data.gltftype) {
      case GltfTypes.ACCESSOR                : return this.createAccessor             (data);
      case GltfTypes.ACCESSOR_SPARSE         : return this.createAccessorSparse       (data);
      case GltfTypes.ACCESSOR_SPARSE_INDICES : return this.createAccessorSparseIndices(data);
      case GltfTypes.ACCESSOR_SPARSE_VALUES  : return this.createAccessorSparseValues (data);
      case GltfTypes.ANIMATION               : return this.createAnimation            (data);
      case GltfTypes.ANIMATION_SAMPLER       : return this.createAnimationSampler     (data);
      case GltfTypes.ANIMATION_CHANNEL       : return this.createAnimationChannel     (data);
      case GltfTypes.ASSET                   : return this.createAsset                (data);
      case GltfTypes.BUFFER                  : return this.createBuffer               (data);
      case GltfTypes.BUFFERVIEW              : return this.createBufferview           (data);
      case GltfTypes.CAMERA                  : return this.createCamera               (data);
      case GltfTypes.IMAGE                   : return this.createImage                (data);
      case GltfTypes.MATERIAL                : return this.createMaterial             (data);
      case GltfTypes.MESH                    : return this.createMesh                 (data);
      case GltfTypes.NODE                    : return this.createNode                 (data);
      case GltfTypes.NORMAL_TEXTURE_INFO     : return this.createNormalTextureInfo    (data);
      case GltfTypes.OCCLUSION_TEXTURE_INFO  : return this.createOcclusionTextureInfo (data);
      case GltfTypes.PRIMITIVE               : return this.createPrimitive            (data);
      case GltfTypes.SAMPLER                 : return this.createSampler              (data);
      case GltfTypes.SCENE                   : return this.createScene                (data);
      case GltfTypes.SKIN                    : return this.createSkin                 (data);
      case GltfTypes.TEXTURE                 : return this.createTexture              (data);
      case GltfTypes.TEXTURE_INFO            : return this.createTextureInfo          (data);

    }
  }

  async createAccessor             ( data:Gltf2.IAccessor                     ) : Promise<Accessor> {
    const el = new Accessor();
    await el.parse( this.loader, data );
    return el;
  }

  async createAccessorSparse       ( data:Gltf2.IAccessorSparse               ) : Promise<AccessorSparse> {
    const el = new AccessorSparse();
    await el.parse( this.loader, data );
    return el;
  }


  async createAccessorSparseIndices( data:Gltf2.IAccessorSparseIndices               ) : Promise<AccessorSparseIndices> {
    const el = new AccessorSparseIndices();
    await el.parse( this.loader, data );
    return el;
  }  

  async createAccessorSparseValues( data:Gltf2.IAccessorSparseValues               ) : Promise<AccessorSparseValues> {
    const el = new AccessorSparseValues();
    await el.parse( this.loader, data );
    return el;
  }
  
  async createAsset  ( data : Gltf2.IAsset ) : Promise<Asset> {
    const el = new Asset();
    await el.parse( this.loader, data );
    return el;
  }
  
  async createBuffer  ( data : Gltf2.IBuffer ) : Promise<Buffer> {
    const el = new Buffer();
    await el.parse( this.loader, data );
    return el;
  }

  async createBufferview  ( data : Gltf2.IBufferView ) : Promise<BufferView> {
    const el = new BufferView();
    await el.parse( this.loader, data );
    return el;
  }

  async createAnimationChannel     ( data:Gltf2.IAnimationChannel ) : Promise<AnimationChannel> {
    const el = new AnimationChannel();
    await el.parse( this.loader, data );
    return el;
  }

  async createAnimationSampler     ( data:Gltf2.IAnimationSampler             ) : Promise<AnimationSampler> {
    const el = new AnimationSampler();
    await el.parse( this.loader, data );
    return el;
  }


  async createAnimation            ( data:Gltf2.IAnimation                    ) : Promise<Animation> {
    const el = new Animation();
    await el.parse( this.loader, data );
    return el;
  }

  async createCamera               ( data:Gltf2.ICamera                       ) : Promise<Camera> {
    const el = new Camera();
    await el.parse( this.loader, data );
    return el;
  }

  async createImage                ( data:Gltf2.IImage                        ) : Promise<Image> {
    const el = new Image();
    await el.parse( this.loader, data );
    return el;
  }

  async createMaterial             ( data:Gltf2.IMaterial                     ) : Promise<Material> {
    const el = new Material();
    await el.parse( this.loader, data );
    return el;
  }

  async createMesh                 ( data:Gltf2.IMesh                         ) : Promise<Mesh> {
    const el = new Mesh();
    await el.parse( this.loader, data );
    return el;
  }

  async createNode                 ( data:Gltf2.INode                         ) : Promise<Node> {
    const el = new Node();
    await el.parse( this.loader, data );
    return el;
  }

  async createNormalTextureInfo    ( data:Gltf2.IMaterialNormalTextureInfo    ) : Promise<NormalTextureInfo> {
    const el = new NormalTextureInfo();
    await el.parse( this.loader, data );
    return el;
  }

  async createOcclusionTextureInfo ( data:Gltf2.IMaterialOcclusionTextureInfo ) : Promise<OcclusionTextureInfo> {
    const el = new OcclusionTextureInfo();
    await el.parse( this.loader, data );
    return el;
  }

  async createPbrMetallicRoughness ( data:Gltf2.IMaterialPbrMetallicRoughness ) : Promise<PbrMetallicRoughness> {
    const el = new PbrMetallicRoughness();
    await el.parse( this.loader, data );
    return el;
  }

  async createPrimitive            ( data:Gltf2.IMeshPrimitive                ) : Promise<Primitive> {
    const el = new Primitive();
    await el.parse( this.loader, data );
    return el;
  }

  async createSampler              ( data:Gltf2.ISampler                      ) : Promise<Sampler> {
    const el = new Sampler();
    await el.parse( this.loader, data );
    return el;
  }

  async createScene                ( data:Gltf2.IScene                        ) : Promise<Scene> {
    const el = new Scene();
    await el.parse( this.loader, data );
    return el;
  }

  async createSkin                 ( data:Gltf2.ISkin                         ) : Promise<Skin> {
    const el = new Skin();
    await el.parse( this.loader, data );
    return el;
  }

  async createTexture              ( data:Gltf2.ITexture                      ) : Promise<Texture> {
    const el = new Texture();
    await el.parse( this.loader, data );
    return el;
  }

  async createTextureInfo          ( data:Gltf2.ITextureInfo                  ) : Promise<TextureInfo> {
    const el = new TextureInfo();
    await el.parse( this.loader, data );
    return el;
  }



}


class DefaultExtensionFactory implements IExtensionFactory {

  name: 'default' = 'default';

  createInstance(gltfLoader: GltfLoader): IExtensionInstance {
    return new DefaultExtensionInstance( gltfLoader );
  }
  
}

const defaultExtension = new DefaultExtensionFactory();

Gltf.addExtension( defaultExtension );