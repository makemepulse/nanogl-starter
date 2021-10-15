
export function isAllOnes( a : ArrayLike<number> ) : boolean {
  for (let i = 0; i < a.length; i++) {
    if( a[i] !== 1 ) return false;
  }
  return true;
}

export function isAllZeros( a : ArrayLike<number> ) : boolean {
  for (let i = 0; i < a.length; i++) {
    if( a[i] !== 0 ) return false;
  }
  return true;
}
