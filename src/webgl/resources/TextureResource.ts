import { Texture } from "nanogl/texture-base";
import { Resource } from "./Resource";
import Texture2D from "nanogl/texture-2d";
import TextureCube from "nanogl/texture-cube";
import { ITextureRequest, ITextureRequestLod, ITextureRequestOptions, resolveTextureOptions } from "./TextureRequest";
import { BytesResource } from "./Net";
import { TextureCodecs } from "./TextureCodec";
import { IGLContextProvider } from "./IGLContextProvider";
import { GLContext } from "nanogl/types";
import TexturesLoader from "./TextureLoader";
import ResourceGroup, { ResourceOrGroup } from "./ResourceGroup";
import Capabilities from "@webgl/core/Capabilities";




export abstract class BaseTextureResource<T extends Texture = Texture> extends Resource<T> {

  texture: T = null;

  glp: IGLContextProvider;

  protected _request: ITextureRequest;
  private _sourceGroup : ResourceGroup<ArrayBuffer> 

  // readonly options : TextureOptions



  static _tlmap : WeakMap<GLContext, TexturesLoader> = new WeakMap()
  static getTextureLoader( gl:GLContext ) : TexturesLoader {
    let res = this._tlmap.get( gl );
    if( !res ){
      res = new TexturesLoader( gl )
      this._tlmap.set( gl, res );
    }
    return res;
  }


  constructor(request: ITextureRequest, glp: IGLContextProvider) {
    super();
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
    if( this.texture === null ){
      this.texture = this.createTexture()
    }
    await this.loadLevelAsync( 0 );
    return this.texture
  }


  doUnload():void  {
    this.texture.dispose()
    this.texture = null;
    this._sourceGroup?.unload()
  }



  async loadLevelAsync(level: number): Promise<T> {
    const gl = this.glp.gl 
    const loader = BaseTextureResource.getTextureLoader( gl );
    const options = resolveTextureOptions( this._request.options )

    // find which source is available based on codecs and extensions
    //
    const cres = await TextureCodecs.getCodecForRequest(this._request, gl );
    if( cres === null ){
      throw `can't find codecs for request ${JSON.stringify(this._request) }`
    }
    const [codec, source] = cres

    // load files for a given request source based on lod
    await this.loadSourceLod(source.lods[level]);
    // run codec to create or setup TextureData
    try {
      await codec.decodeLod(source, level, options, gl);
    } catch(e){
      console.error( `can't decode `, source );
      throw e
    }
    // use texture loader to upload data to texture
    loader.upload(this as unknown as BaseTextureResource<Texture>, source.datas);
    this._configureTexture( options )

    
    return this.texture;

  }

  private _configureTexture( options : ITextureRequestOptions ):void {
    
    const gl = this.texture.gl
    this.texture.setFilter( options.smooth, options.mipmap, options.miplinear )

    if( options.mipmap ){
      gl.generateMipmap(this.texture._target)
    }

    const aniso = Math.min( Capabilities(gl).maxAnisotropy , options.aniso )
    if( aniso > 0 ){
      gl.texParameterf( gl.TEXTURE_2D, Capabilities(gl).extAniso.TEXTURE_MAX_ANISOTROPY_EXT, aniso );
    }

    switch( options.wrap ){
      case 'clamp': this.texture.clamp(); break;
      case 'repeat': this.texture.repeat(); break;
      case 'mirror': this.texture.mirror(); break;
    }

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

    const gl = this.glp.gl 
    const options = resolveTextureOptions( this._request.options )
    const loader = BaseTextureResource.getTextureLoader( gl );
    // find which source is available based on codecs and extensions
    // TODO: test if null
    const [codec, source] = await TextureCodecs.getCodecForRequest(this._request, gl);

    for (let i = 0; i < source.lods.length; i++) {
      // load files for a given request source based on lod
      await this.loadSourceLod(source.lods[i]);
      // console.log(source.datas);
    }
    // run codec to create or setup TextureData
    await codec.decodeCube(source, options, gl);
    // use texture loader to upload data to texture
    loader.upload(this as unknown as BaseTextureResource<Texture>, source.datas);


    //
    return this.texture;

  }

}