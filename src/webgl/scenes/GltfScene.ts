import { RenderContext } from "@webgl/core/Renderer";
import Gltf from "@webgl/lib/nanogl-gltf/lib";
import Animation from "@webgl/lib/nanogl-gltf/lib/elements/Animation";
import MaterialOverrideExtension from "@webgl/lib/nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import GLTFResource from "@webgl/resources/GltfResource";
import Node from "nanogl-node";
import BaseMaterial from "nanogl-pbr/BaseMaterial";
import { GLContext } from "nanogl/types";
import { materialIsStandard } from "./GltfUtils";
import Lighting from "./Lighting";


export class GltfScene extends GLTFResource {
  

  private _materialOverride: MaterialOverrideExtension;
  
  constructor( request: string, gl:GLContext, private lighting?: Lighting, private parent?:Node ) {
    super(request, {gl} )
    
    this._materialOverride = new MaterialOverrideExtension()

    this.opts = {
      extensions: [this._materialOverride]
    }

  }
  

  async doLoad(): Promise<Gltf> {
    const gltf = await super.doLoad()

    if (this.lighting){
      for (const material of gltf.materials) {
        if( materialIsStandard(material)){
          this.lighting.setupStandardPass(material.materialPass);
        }
      }
    }
    this.parent?.add( gltf.root )

    return gltf
  }
  
  overrideMaterial(name: string, factory: () => BaseMaterial ):void {
    this._materialOverride.add( name, factory )
  }

  
  render( context:RenderContext ) : void {
    const gltf = this.gltf
    for (const renderable of gltf.renderables) {
      renderable.render(context.gl, context.camera, context.mask, context.pass, context.glConfig )
    }
  }


  preRender():void{
    if( this.anim ){
      this.anim.evaluate( (Date.now()/1000)%this.anim.duration )
    }
  }


  anim: Animation

  playAnimation(name:string):void{
    this.anim = this.gltf.getAnimation( name );
  }

}