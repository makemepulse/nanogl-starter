import Texture2D from "nanogl/texture-2d";
import { TextureResource } from "./TextureResource";

export default class TextureLibrary {

  map : Map<string, TextureResource> = new Map()
  list : TextureResource[] = []


  add( id:string, t:TextureResource ): void{
    if( this.map.has( id ) ) throw `texture ${id} already exist`
    this.map.set( id, t )
    this.list.push( t )
  }
  
  get( id:string ) : Texture2D {
    if( !this.map.has( id ) ) throw `texture ${id} doesn't exist`
    return this.map.get( id ).texture
  }
  
  has( id:string ) : boolean {
    return this.map.has( id )
  }

  load():Promise<void>{
    return Promise.all( this.list.map( t=>t.load() ) ).then()
  }

}