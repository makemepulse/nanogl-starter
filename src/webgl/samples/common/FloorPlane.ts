import Node from "nanogl-node";
import Material from "nanogl-pbr/Material";
import Flag from "nanogl-pbr/Flag";
import Rect from "nanogl-primitives-2d/rect";
import GLState from 'nanogl-state/GLState';
import { RenderContext } from "@webgl/core/Renderer";
import { StandardMetalness } from "nanogl-pbr/StandardPass";
import { GLContext, isWebgl2 } from "nanogl/types";


export default class FloorPlane {

  geom: Rect;
  material: Material;
  node: Node;

  constructor(private gl:GLContext ){
    this.geom = new Rect(gl)
    
    this.node = new Node()
    this.node.rotateX(Math.PI/2)

    this.material = new Material(gl)
    const pass = new StandardMetalness()
    pass.version.set( isWebgl2(gl)?"300 es":"100")
    pass.glconfig.enableDepthTest()
    pass.surface.baseColor.attachConstant( [1, 1, 1, 1.0] );
    pass.surface.metalness.attachConstant( 0 );
    pass.surface.roughness.attachConstant( 1 );

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