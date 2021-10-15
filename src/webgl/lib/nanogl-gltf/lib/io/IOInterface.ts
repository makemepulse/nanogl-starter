

export default interface IOInterface {

  resolveBaseDir( path: string ) : string[]
  resolvePath( path: string, base : string ) : string
  
  loadResource(path: string, abortSignal : AbortSignal ): Promise<string>
  loadBinaryResource(path: string, abortSignal : AbortSignal ): Promise<ArrayBuffer>
  // loadImageBuffer(arrayView:Uint8Array, mimetype : string, abortSignal : AbortSignal) : Promise<TexImageSource>;
  // loadImage(uri:string, abortSignal : AbortSignal) : Promise<TexImageSource>;
  loadImageBlob( blob : Blob, abortSignal : AbortSignal ) : Promise<TexImageSource>

  writeResource(path: string, data: string): Promise<boolean>
  writeBinaryResource(path: string, data: ArrayBuffer): Promise<boolean>
  decodeUTF8( buffer : ArrayBuffer, offset? : number, length? : number ) : string

  // decodeDataURI( uri : string ) : ArrayBuffer;
  // isDataURI( uri : string ) : Boolean;
  
}
