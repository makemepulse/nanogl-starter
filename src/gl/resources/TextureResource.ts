import AbortSignalUtils from "../../utils/AbortSignalUtils";
import Deferred from "../../utils/Deferred";
import { BytesResource } from "./Net";
import { Resource, ResourceState } from "./Resource";
import ResourceGroup, { ResourceOrGroup } from "./ResourceGroup";
import { TextureCodecs } from "./TextureCodec";
import TexturesLoader from "./TextureLoader";
import { ITextureOptions, ITextureRequest, ITextureRequestLod, TextureSrcSet, resolveTextureOptions } from "./TextureRequest";




export default class TextureResource extends Resource<GPUTexture> {

  get texture(): GPUTexture | null {
    return this.value;
  }

  readonly device: GPUDevice;

  protected _request: ITextureRequest;
  protected _options: ITextureOptions;
  private _sourceGroup? : ResourceGroup<ArrayBuffer> 

  protected _loadLevelDeferred?: Deferred<GPUTexture>
  private _loadLevelAbortCtrl? : AbortController
  private _loadLevelAbortSignal? : AbortSignal

  private _lodLevel = 0;
  public get lodLevel() {
    return this._lodLevel;
  }
  public set lodLevel(value) {
    if( this._lodLevel !== value ){
      this._lodLevel = value;
      if( this.state !== ResourceState.UNLOADED ){
        this._doLoadLevel( value )
      }
    }
  }
  
  // readonly options : TextureOptions



  static _tlmap : WeakMap<GPUDevice, TexturesLoader> = new WeakMap()
  static getTextureLoader( device : GPUDevice ) : TexturesLoader {
    let res = this._tlmap.get( device );
    if( !res ){
      res = new TexturesLoader( device )
      this._tlmap.set( device, res );
    }
    return res;
  }


  constructor(request: ITextureRequest | string, device: GPUDevice, options?: Partial<ITextureOptions> ) {
    super();
    this.device = device;
    if( typeof request === 'string' ){
      request = new TextureSrcSet( request )
    }
    this._request = request;
    this._options = resolveTextureOptions( options )
  }

  get request() : ITextureRequest {
    return this._request;
  }



  doLoad(): Promise<GPUTexture> {
    this._loadLevelDeferred = new Deferred<GPUTexture>()
    // loadLevelAsync can abort if lodLevel if changed mid air
    this._doLoadLevel( this._lodLevel );
    return this._loadLevelDeferred.promise
  }
  
  doUnload():void  {
    this.texture?.destroy()
    this._sourceGroup?.unload()
  }



  private _doLoadLevel(level: number): void {
    this._loadLevelAbortCtrl?.abort()
    this._loadLevelAbortCtrl = new AbortController()
    this._loadLevelAbortSignal = AbortSignalUtils.anySignals([this._loadLevelAbortCtrl.signal, this.abortSignal!])
    this.loadLevelAsync( level, this._loadLevelAbortSignal! )
      .then ( this._loadLevelDeferred!.resolve )
      .catch( this._loadLevelDeferred!.reject )
  }


  protected async loadLevelAsync(level: number, signal:AbortSignal): Promise<GPUTexture> {


    const gl = this.device 
    const loader = TextureResource.getTextureLoader( gl );

    // find which source is available based on codecs and extensions
    //
    const cres = await TextureCodecs.getCodecForRequest(this._request, gl );
    signal.throwIfAborted()

    if( cres === null ){
      throw `can't find codecs for request ${JSON.stringify(this._request) }`
    }
    const [codec, source] = cres
    
    // load files for a given request source based on lod, set buffers
    const buffers = await this.loadSourceLod(source.lods[level], signal);
    // run codec to create or setup TextureData
    try {
      
      // take buffers , set datas
      const textureDatas = await codec.decodeLod(source, level, buffers, this._options, gl);
      
      signal.throwIfAborted()
      
      // use texture loader to upload data to texture
      const texture = loader.upload(textureDatas);
      
      this._applyFilter()
      this._applyAnisotropy()
      this._applyWrapping()
      
      return texture;
      
    } catch(e){
      if( !AbortSignalUtils.isAbortError(e) ){
        console.error( `can't decode `, source );
      }
      throw e
    }
    
    
    
  }
  

  
  /**
   * mark this texture as transparent. Must be called before loading
   */
  setTransparent(): this {
    if( this.state !== ResourceState.UNLOADED ){
      throw "setTransparent() can't be call on loaded resource"
    }
    this._options.alpha = true
    return this
  }

  /**
   * mark this texture as opaque. Must be called before loading
   */
  setOpaque(): this {
    if( this.state !== ResourceState.UNLOADED ){
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
    this._applyFilter()
    return this
  }

  setAnisotropy(aniso: 0|2|4|8|16): this {
    this._options.aniso = aniso;
    this._applyAnisotropy()
    return this
  }

  clamp(): this {
    this._options.wrap = 'clamp'
    this._applyWrapping()
    return this
  }
  
  repeat(): this {
    this._options.wrap = 'repeat'
    this._applyWrapping()
    return this
  }
  
  mirror(): this {
    this._options.wrap = 'mirror'
    this._applyWrapping()
    return this
  }


  private _applyFilter():void {
    const options = this._options
    // TODO apply filtering : options.smooth, options.mipmap, options.miplinear )

    if( options.mipmap === true ){
      // generate mipmaps :/
    }
  }

  private _applyAnisotropy():void {
    // const options = this._options
    // const gl = this.device
    // const aniso = Math.min( Capabilities(gl).maxAnisotropy , options.aniso )
    // if( aniso > 0 ){
    // }
  }

  private _applyWrapping():void {
    // switch( this._options.wrap ){
    //   case 'clamp' : this._texture. clamp(); break;
    //   case 'repeat': this._texture.repeat(); break;
    //   case 'mirror': this._texture.mirror(); break;
    // }
  }


  protected async loadSourceLod(lod: ITextureRequestLod, signal:AbortSignal ): Promise<ArrayBuffer[]> {

    this._sourceGroup?.unload()

    this._sourceGroup = new ResourceGroup()

    for (let i = 0; i < lod.files.length; i++) {
      const res = new BytesResource(lod.files[i]);
      this._sourceGroup.add( res as ResourceOrGroup<ArrayBuffer>)
    }

    const buffers = await this._sourceGroup.load( signal );
    return buffers;
  }


}
