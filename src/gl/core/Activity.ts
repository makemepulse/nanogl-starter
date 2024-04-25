import type { AnyPromise } from "../../utils/AnyPromise";
import type Engine from "../Engine";
import ResourceGroup from "../resources/ResourceGroup";


export type ActivityFactory<T extends IActivity> = ( engine: Engine ) => T;

export default interface IActivity {

  load( signal?: AbortSignal ): AnyPromise;

  unload(): void;

  start(): void;

  stop(): void;

  render(): void;

}


export abstract class BaseActivity extends ResourceGroup implements IActivity {
  

  constructor( protected engine: Engine ) {
    super()
  }
  
  abstract start(): void;
  abstract stop(): void;
  abstract render(): void;
  

}