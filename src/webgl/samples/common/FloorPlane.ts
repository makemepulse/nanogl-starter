import { RenderContext } from "@webgl/core/Renderer";
import Node from "nanogl-node";
import BaseMaterial from "nanogl-pbr/BaseMaterial";
import Flag from "nanogl-pbr/Flag";
import { StandardMetalness } from "nanogl-pbr/StandardPass";
import Rect from "nanogl-primitives-2d/rect";
import GLState from 'nanogl-state/GLState';
import { GLContext, isWebgl2 } from "nanogl/types";


export default class FloorPlane {

  geom: Rect;
  material: BaseMaterial;
  node: Node;

  constructor(private gl:GLContext ){
    this.geom = new Rect(gl)
    
    this.node = new Node()
    this.node.rotateX(Math.PI/2)

    this.material = new BaseMaterial(gl)
    const pass = new StandardMetalness()
    pass.version.set( isWebgl2(gl)?"300 es":"100")
    pass.glconfig.enableDepthTest()

    this.material.inputs.add( new Flag('hasNormals', false ))
    this.material.inputs.add( new Flag('hasTangents', false ))
    this.material.addPass( pass )
    

  }

  render( ctx: RenderContext ) : void {

    if( ! this.material.hasPass( ctx.pass ) ) return

    const passInstance = this.material.getPass( ctx.pass )

    if ((passInstance.pass.mask & ctx.mask) === 0) return;

    passInstance.prepare( this.node, ctx.camera )

    const glstate = GLState.get(this.gl)

    glstate.push( passInstance.pass.glconfig );
    this.material.glconfig  && glstate.push(this.material.glconfig);
    ctx.glConfig            && glstate.push(ctx.glConfig);
    
    glstate.apply()
    
    // render
    // ----------
    this.geom.attribPointer( passInstance.getProgram() )
    this.geom.render()
    
    // pop configs
    // -------------
    
    glstate.pop();
    this.material.glconfig  && glstate.pop()
    ctx.glConfig            && glstate.pop()

  }

}