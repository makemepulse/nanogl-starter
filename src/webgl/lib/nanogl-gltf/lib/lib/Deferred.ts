

export default class Deferred<T=unknown> {

  readonly promise : Promise<T>;
  
  _resolve : (value?: T | PromiseLike<T>) => void;
  _reject  : (reason?: any) => void;

  constructor(){
      this.promise = new Promise<T>( (resolve, reject)=>{
          this._resolve = resolve;
          this._reject = reject;
      })
  }

  resolve = (value?: T | PromiseLike<T>) => {
      this._resolve( value );
  }

  reject = (reason?: any) => {
      this._reject( reason );
  }
  
}