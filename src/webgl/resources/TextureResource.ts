import { Texture } from "nanogl/texture-base";
import { Resource } from "./Resource";
import Texture2D from "nanogl/texture-2d";
import TextureCube from "nanogl/texture-cube";
import { ITextureRequest, ITextureRequestLod } from "./TextureRequest";
import { BytesResource } from "./Net";
import { TextureCodecs } from "./TextureCodec";
import { IGLContextProvider } from "./IGLContextProvider";
import { GLContext } from "nanogl/types";
import TexturesLoader from "./TextureLoader";
import ResourceGroup, { ResourceOrGroup } from "./ResourceGroup";


export enum TextureWrap {
  CLAMP,
  REPEAT,
  MIRROR,
}

// class TextureFiltering {
//   smooth: boolean = false
//   mip: boolean = false
//   mipl: boolean = false

//   wrap: TextureWrap = TextureWrap.REPEAT

//   setFilter(smooth: boolean = false, mip: boolean = false, mipl: boolean = false) {
//     this.smooth = smooth;
//     this.mip = mip;
//     this.mipl = mipl;
//   }

// }

// class TextureOptions {
//   bbc: boolean = true
//   flipY: boolean = false
//   genMips: boolean = false
//   filtering: TextureFiltering = new TextureFiltering();
// }


export type TextureOptions = {
  smooth     : boolean
  mipmap     : boolean
  miplinear  : boolean
  genmipmaps : boolean
  aniso: 0|2|4|8|16
  wrap: 'repeat'|'clamp'|'mirror'
}

const _DEFAULT_OPTS : TextureOptions = {

  smooth: true,
  mipmap: false,
  miplinear: false,

  genmipmaps: false,

  aniso: 0,
  wrap: 'repeat',
}


export abstract class BaseTextureResource<T extends Texture = Texture> extends Resource<T> {

  texture: T = null;

  glp: IGLContextProvider;

  protected _request: ITextureRequest;
  private _sourceGroup : ResourceGroup<ArrayBuffer> 

  readonly options : TextureOptions



  static _tlmap : WeakMap<GLContext, TexturesLoader> = new WeakMap()
  static getTextureLoader( gl:GLContext ) : TexturesLoader {
    let res = this._tlmap.get( gl );
    if( !res ){
      res = new TexturesLoader( gl )
      this._tlmap.set( gl, res );
    }
    return res;
  }


  constructor(request: ITextureRequest, glp: IGLContextProvider, opts: Partial<TextureOptions> = {}) {
    super();
    this.options = Object.assign( {}, _DEFAULT_OPTS, opts)
    this.glp = glp;
    this._request = request;
  }

  get request() : ITextureRequest {
    return this._request;
  }

  get value(): T {
    return this.texture;
  }


  async doLoad(): Promise<T> {
    this.texture = this.createTexture()
    await this.loadLevelAsync( 0 );
    this.setupOptions()
    return this.texture
  }


  doUnload():void  {
    this.texture.dispose()
    this.texture = null;
    this._sourceGroup?.unload()
  }

  setupOptions():void {

    const gl = this.texture.gl
    this.texture.setFilter( this.options.smooth, this.options.mipmap, this.options.miplinear )

    if( this.options.genmipmaps ){
      this.texture.bind()
      gl.generateMipmap(this.texture._target)
    }

    if( this.options.aniso > 0 ){
      const loader = BaseTextureResource.getTextureLoader( gl );
      gl.texParameterf( gl.TEXTURE_2D, loader.extAniso.TEXTURE_MAX_ANISOTROPY_EXT, this.options.aniso );
    }

    switch( this.options.wrap ){
      case 'clamp': this.texture.clamp(); break;
      case 'repeat': this.texture.repeat(); break;
      case 'mirror': this.texture.mirror(); break;
    }

  }

  async loadLevelAsync(level: number): Promise<T> {

    const loader = BaseTextureResource.getTextureLoader( this.glp.gl );

    const extensions = loader.extTextures;
    // find which source is available based on codecs and extensions
    // TODO: test if null
    const cres = await TextureCodecs.getCodecForRequest(this._request, extensions);
    if( cres === null ){
      throw `can't find codecs for request ${JSON.stringify(this._request) }`
    }
    const [codec, source] = cres

    // load files for a given request source based on lod
    await this.loadSourceLod(source.lods[level]);
    // run codec to create or setup TextureData
    try {
      await codec.decodeLod(source, level, extensions);
    } catch(e){
      console.error( `can't decode `, source );
      
      throw e
    }
    // use texture loader to upload data to texture
    loader.upload(this as unknown as BaseTextureResource<Texture>, source.datas);

    // for (let i = 0; i < source.lods[level].files.length; i++) {
    //   this.group.removeResourceByName(source.lods[level].files[i]);
    // }

    return this.texture;

  }


  async loadSourceLod(lod: ITextureRequestLod): Promise<ArrayBuffer[]> {

    this._sourceGroup?.unload()

    this._sourceGroup = new ResourceGroup()

    for (let i = 0; i < lod.files.length; i++) {
      const res = new BytesResource(lod.files[i]);
      this._sourceGroup.add( res as ResourceOrGroup<ArrayBuffer>)
    }

    const buffers = await this._sourceGroup.load();
    lod.buffers = buffers;
    return buffers;
  }

  abstract createTexture():T;

}


export class TextureResource extends BaseTextureResource<Texture2D> {
  
  createTexture(): Texture2D {
    return new Texture2D(this.glp.gl);
  }

}



export class TextureCubeResource extends BaseTextureResource<TextureCube> {

  createTexture(): TextureCube {
    return new TextureCube(this.glp.gl);
  }


  async loadLevelAsync(): Promise<TextureCube> {

    const loader = BaseTextureResource.getTextureLoader( this.glp.gl );
    const extensions = loader.extTextures;
    // find which source is available based on codecs and extensions
    // TODO: test if null
    const [codec, source] = await TextureCodecs.getCodecForRequest(this._request, extensions);

    for (let i = 0; i < source.lods.length; i++) {
      // load files for a given request source based on lod
      await this.loadSourceLod(source.lods[i]);
      // console.log(source.datas);
    }
    // run codec to create or setup TextureData
    await codec.decodeCube(source, extensions);
    // use texture loader to upload data to texture
    loader.upload(this as unknown as BaseTextureResource<Texture>, source.datas);


    //
    return this.texture;

  }

}