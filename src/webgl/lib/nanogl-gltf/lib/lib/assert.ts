

function _throw( msg:string ){
    throw new Error( msg );
  }
  
  
  const Assert = {
    /**
     * Assert o is not undefined
     * @param {any} o 
     * @param {string} msg 
     */
    isDefined( o:any, msg='' ){
      if( o === undefined ) _throw( msg );
    },
  
    /**
     * Assert o is undefined
     * @param {any} o 
     * @param {string} msg 
     */
    isUndefined( o:any, msg='' ){
      if( o !== undefined ) _throw( msg );
    },
  
    /**
     * Assert o is true
     * @param {boolean} o 
     * @param {string} msg 
     */
    isTrue( o:any, msg='' ){
      if( o !== true ) _throw( msg );
    },
  
    /**
     * Assert o is false
     * @param {boolean} o 
     * @param {string} msg 
     */
    isFalse( o:any, msg='' ){
      if( o !== false ) _throw( msg );
    }
  
  }
  
  
  export default Assert;