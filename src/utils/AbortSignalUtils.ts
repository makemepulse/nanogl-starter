
export class AbortError extends Error {
  constructor(message: string = 'Aborted') {
      super(message);
      this.name = "AbortError";
  }
}


const _noneSignal = new AbortController().signal


/**
 * wrap a promise, and a return a proxy promise wich resolve with the same value, but reject with AbortError if the signal is aborted
 * @param promise the promise to wrap
 * @param signal the abort signal to listen to
 * @returns 
 */
async function wrapAbort<T>( promise: Promise<T>, signal: AbortSignal ): Promise<T> {
  const val: T = await promise
  if( signal.aborted ){
    throw new AbortError(signal.reason)
  }
  return val
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function catchIfAbortError( e: any ){
  if( !isAbortError(e) ){
    throw e
  }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function catchAbortError<T=any>( p: Promise<T> ):Promise<void|T>{
  return p.catch( catchIfAbortError )
}

/**
 * return true if error is AbortError
 * @param e 
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAbortError( e: any ){
  return ( e.name === 'AbortError' || e.message === 'Aborted' )
}

function anySignals( signals: AbortSignal[] ){
  // @ts-ignore (remove when lib dom declares AbortSignal any() method)
  return AbortSignal.any( signals );
}


const AbortSignalUtils = {
  wrapAbort,
  catchIfAbortError,
  catchAbortError,
  isAbortError,
  anySignals,
  noneSignal: _noneSignal
} as const


export default AbortSignalUtils