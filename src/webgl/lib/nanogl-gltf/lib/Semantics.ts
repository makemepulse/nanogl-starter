
const Semantics = {
  POSITION :{indexed:false, attrib:'aPosition'   },
  NORMAL   :{indexed:false, attrib:'aNormal'     },
  TANGENT  :{indexed:false, attrib:'aTangent'    },
  TEXCOORD :{indexed:true , attrib:'aTexCoord'   },
  COLOR    :{indexed:true , attrib:'aColor'      },
  JOINTS   :{indexed:true , attrib:'aSkinJoints' },
  WEIGHTS  :{indexed:true , attrib:'aSkinWeights'},
}


export interface ISemantics {
  getMorphedAttributeName(semantic: string, index : number):string
  getAttributeName( semantic:string):string
}


export class DefaultSemantics implements ISemantics {

  getMorphedAttributeName(semantic: string, index : number){
    return this.getAttributeName( semantic )+'_mt'+index;
  }
  
  getAttributeName(semantic: string ): string {
    const [basename, set_index=0] = semantic.split( '_' );
    const infos = Semantics[basename as keyof typeof Semantics];

    if( infos !== undefined ) {
      if( set_index > 0 || infos.indexed )
        return infos.attrib+set_index;
      return infos.attrib
    }
    throw new Error(`Invalid Semantic ${semantic}`)
    // return semantic;
  }

}