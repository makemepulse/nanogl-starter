import { Texture } from "nanogl/texture-base";
import { Resource, ResourceState } from "./Resource";
import Texture2D from "nanogl/texture-2d";
import TextureCube from "nanogl/texture-cube";
import { ITextureRequest, ITextureRequestLod, ITextureOptions, resolveTextureOptions, TextureSrcSet } from "./TextureRequest";
import { BytesResource } from "./Net";
import { TextureCodecs } from "./TextureCodec";
import { IGLContextProvider } from "./IGLContextProvider";
import { GLContext } from "nanogl/types";
import TexturesLoader from "./TextureLoader";
import ResourceGroup, { ResourceOrGroup } from "./ResourceGroup";
import Capabilities from "@webgl/core/Capabilities";
import { Options } from "vue-class-component";




export abstract class BaseTextureResource<T extends Texture = Texture> extends Resource<T> {

  texture: T = null;

  glp: IGLContextProvider;

  protected _request: ITextureRequest;
  protected _options: ITextureOptions;
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


  constructor(request: ITextureRequest | string, glp: IGLContextProvider, options?: Partial<ITextureOptions> ) {
    super();
    this.glp = glp;
    if( typeof request === 'string' ){
      request = new TextureSrcSet( request )
    }
    this._request = request;
    this._options = resolveTextureOptions( options )
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
      await codec.decodeLod(source, level, this._options, gl);
    } catch(e){
      console.error( `can't decode `, source );
      throw e
    }
    // use texture loader to upload data to texture
    loader.upload(this as unknown as BaseTextureResource<Texture>, source.datas);

    this._applyFilter()
    this._applyAnisotropy()
    this._applyWrapping()
    
    return this.texture;

  }
  /**
   * mark this texture as transparent. Must be called before loading
   */
  setTransparent(): this {
    if( this.state !== ResourceState.PENDING ){
      throw "setTransparent() can't be call on loaded resource"
    }
    this._options.alpha = true
    return this
  }

  /**
   * mark this texture as opaque. Must be called before loading
   */
  setOpaque(): this {
    if( this.state !== ResourceState.PENDING ){
      throw "setOpaque() can't be call on loaded resource"
    }
    this._options.alpha = false
    return this
  }


  setFilter( smooth = false, mipmap = false, miplinear = false ): this {
    const opts = this._options
    opts.smooth = smooth;
    opts.mipmap = mipmap;
    opts.miplinear = miplinear;
    if( this.texture ){
      this._applyFilter()
    }
    return this
  }

  setAnisotropy(aniso: 0|2|4|8|16): this {
    this._options.aniso = aniso;
    if( this.texture ){
      this._applyAnisotropy()
    }
    return this
  }

  clamp(): this {
    this._options.wrap = 'clamp'
    if( this.texture ) { this._applyWrapping() }
    return this
  }
  
  repeat(): this {
    this._options.wrap = 'repeat'
    if( this.texture ) { this._applyWrapping() }
    return this
  }
  
  mirror(): this {
    this._options.wrap = 'mirror'
    if( this.texture ) { this._applyWrapping() }
    return this
  }


  private _applyFilter():void {
    const options = this._options
    const gl = this.texture.gl
    this.texture.setFilter( options.smooth, options.mipmap, options.miplinear )

    if( options.mipmap === true ){
      gl.generateMipmap(this.texture._target)
    }
  }

  private _applyAnisotropy():void {
    const options = this._options
    const gl = this.texture.gl
    const aniso = Math.min( Capabilities(gl).maxAnisotropy , options.aniso )
    if( aniso > 0 ){
      gl.texParameterf( gl.TEXTURE_2D, Capabilities(gl).extAniso.TEXTURE_MAX_ANISOTROPY_EXT, aniso );
    }
  }

  private _applyWrapping():void {
    switch( this._options.wrap ){
      case 'clamp': this.texture. clamp(); break;
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

    const buffers = await this._sourceGroup.load( this.abortSignal );
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
    const options = resolveTextureOptions( this._options )
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