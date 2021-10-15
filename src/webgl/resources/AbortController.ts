
/*
* Shim for AbortController
* =======================================
*/

export interface AbortControllerShim {
  abort(): void
  signal?: AbortSignal
}


let AbortControllerFactory: () => AbortControllerShim;

const _ACShim: AbortControllerShim = {
  abort() {0},
  signal: undefined
}

if (window.AbortController !== undefined) {
  AbortControllerFactory = () => new AbortController();
} else {
  AbortControllerFactory = () => _ACShim;
}

export function CreateAbortController(): AbortControllerShim {
  return AbortControllerFactory();
}

