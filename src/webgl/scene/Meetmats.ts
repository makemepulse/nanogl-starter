import { AssetsPath } from "@/core/PublicPath";
import { IRenderContext } from "@webgl/core/IRenderer";
import Node from "nanogl-node";
import Scene from ".";
import { GltfScene } from "./GltfScene";


const MODELS = [
  'vzla',
  'lava',
  'deadpool',
  'astronaut',
]
export default class Meetmats {

  private gltfs : GltfScene[]
  node: Node;

  constructor( scene:Scene ){
    this.gltfs = MODELS.map( m=>new GltfScene( AssetsPath(`webgl/meetmats/${m}/scene.gltf`), scene ))
    this.node = new Node()
    scene.root.add( this.node )
    this.node.position[1] = 1
  }


  load():Promise<void>{
    return Promise.all( this.gltfs.map( r=>r.load())).then( ()=>this.onLoaded())
  }

  onLoaded():void {
    for (let i = 0; i <  this.gltfs.length; i++) {
      const gltf =  this.gltfs[i];
      gltf.gltf.root.position[0] = i * 2
      this.node.add( gltf.gltf.root )
    }

    this.gltfs[2].gltf.root.setScale(.04)
    this.gltfs[2].gltf.root.position[1] = -1
  }
  
  render(ctx:IRenderContext):void{
    for (const gltf of this.gltfs) {
      gltf.render( ctx )
    }
  }
}