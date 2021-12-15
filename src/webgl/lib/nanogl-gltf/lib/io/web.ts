
import base64 from 'base64-js'

import IOInterface from "./IOInterface";

import UTF8   from '../lib/utf8-decoder'
import GltfIO from ".";
import {AbortSignal} from '@azure/abort-controller'
import { cancellablePromise, createNativeSignal } from '../lib/cancellation';


/**
 * we need a createImageBitmap implementation which support options
 * make test with small data uri png
 */
async function checkCreateImageBitmapCapability() : Promise<boolean>{
  if( window.createImageBitmap === undefined ){
    return false
  }
  const uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
  const request = await fetch( uri )
  const blob = await request.blob();
  try{
    //@ts-ignore
    await window.createImageBitmap( blob, {
      premultiplyAlpha:'none',
      colorSpaceConversion : 'none'
    });
  } catch(e){
    return false;
  }
    
  return true;
}

const CreateImageBitmapAvailable : Promise<boolean> = checkCreateImageBitmapCapability();

function baseDir( p:string ) : string[]{
  const sep = p.lastIndexOf("/");
  return [
    p.substr( 0, sep ),
    p.substr( sep + 1 ),
  ]
}



export class WebImpl implements IOInterface {



  isDataURI( uri : string ) : boolean{
    return ( uri.indexOf('data:') === 0 );
  }


  decodeDataURI(uri: string): ArrayBuffer {
    if( uri.indexOf('data:') !== 0 ){
      throw new Error('invalid dataURI' )
    }
    const b64 = uri.substr( uri.indexOf(',')+1 );

    return base64.toByteArray( b64 ).buffer;
  }
  

  resolveBaseDir( path: string ) : string[]{
    return baseDir( path );
  }

  resolvePath(path: string, baseurl: string ): string {
    console.log(path, baseurl);
    
    if( baseurl === undefined || this.isDataURI( path ) )
      return path;  
    return baseurl + '/' + path;
  }

  decodeUTF8(buffer: ArrayBuffer, offset  = 0, length : number = undefined ): string {
    if( length === undefined ) length = buffer.byteLength - offset;
    return UTF8( new Uint8Array( buffer, offset, length ) );
  }
  
  
  
  async loadResource(path: string, abortSignal : AbortSignal = AbortSignal.none): Promise<string> {
    const signal = createNativeSignal( abortSignal );
    const response = await fetch( path, {signal} );
    return response.text();
  }
  
  async loadBinaryResource(path: string, abortSignal : AbortSignal = AbortSignal.none): Promise<ArrayBuffer> {
    if( this.isDataURI( path ) ){
      return this.decodeDataURI( path );
    }
    const signal = createNativeSignal( abortSignal );
    const response = await fetch( path, {signal} );
    return response.arrayBuffer();
  }
  
  
  async loadImageBuffer(arrayView:Uint8Array, mimetype : string, abortSignal : AbortSignal = AbortSignal.none ) : Promise<TexImageSource> {
    const blob = new Blob( [arrayView] , { type: mimetype });
    return this.loadImageBlob( blob, abortSignal );
  }


  async loadImage(uri:string, abortSignal : AbortSignal = AbortSignal.none) : Promise<TexImageSource> {
    const signal = createNativeSignal( abortSignal );
    const request = await fetch( uri,  {signal} )
    const blob = await request.blob();
    return this.loadImageBlob( blob, abortSignal );
  
  }

  async loadImageBlob( blob : Blob, abortSignal : AbortSignal ) : Promise<TexImageSource> {
    let promise : Promise<TexImageSource>;
    const hasCIB : boolean = await CreateImageBitmapAvailable;

    if( hasCIB )
    {
      //@ts-ignore
      promise = createImageBitmap( blob, {
        premultiplyAlpha:'none',
        colorSpaceConversion : 'none'
      });
    } 
    else {
      
      const img = new window.Image();
      const src = URL.createObjectURL(blob);

      const loadPromise = new Promise( (resolve, reject)=>{
        img.onload  = resolve;
        img.onerror = reject;
        img.src = src;
      }).finally( ()=>URL.revokeObjectURL(src) )

      promise = loadPromise.then( ()=>img );

    }

    return cancellablePromise( promise, abortSignal );
  }



  writeResource(path: string, data: string) : Promise<boolean>{
    throw new Error("Method not implemented.");
  }
  
  writeBinaryResource(path: string, data: ArrayBuffer) : Promise<boolean>{
    throw new Error("Method not implemented.");
  }


}


export const IO = new WebImpl();
const _instance :  GltfIO = new  GltfIO( IO );

export default _instance;
