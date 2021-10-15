import { AbortSignalLike } from "@azure/abort-controller";

export function cancellablePromise<T>( p:Promise<T>, signal:AbortSignalLike ) : Promise<T> {
  return new Promise<T>((resolve, reject)=>{
    signal.addEventListener( 'abort', (r:any)=>reject(r) )
    p.then( resolve, reject );
  });
}



let _createNativeSignal : ( signal:AbortSignalLike ) => AbortSignal|undefined;

if( window.AbortController !== undefined ){

  _createNativeSignal = ( signal:AbortSignalLike ) => {
    const ctrl = new AbortController();
    signal.addEventListener( 'abort', ()=>ctrl.abort() );
    return ctrl.signal;
  }
} else {
  _createNativeSignal = ( signal:AbortSignalLike ) => undefined;
}

export const createNativeSignal = _createNativeSignal;

export function isAbortError( e : any ) : boolean {
  return e.name === 'AbortError'; 
}
