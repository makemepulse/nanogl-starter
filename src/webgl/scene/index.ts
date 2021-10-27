import { AssetsPath } from "@/core/PublicPath"
import { IRenderContext } from "@webgl/core/IRenderer"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import MeshRenderer from "@webgl/lib/nanogl-gltf/lib/renderer/MeshRenderer"
import { IGLContextProvider } from "@webgl/resources/IGLContextProvider"
import { vec3 } from "gl-matrix"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "./GltfScene"
import Lighting from "./Lighting"
import Meetmats from "./Meetmats"


export default class Scene implements IGLContextProvider {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  root       : Node
  meetmats: Meetmats
  
  constructor( glp : IGLContextProvider ){
    this.gl = glp.gl
    this.root       = new Node()
    this.lighting   = new Lighting( this.gl )

    // this.gltfSample = new GltfScene( AssetsPath("webgl/Lu_Scene.gltf"), this )
    // this.gltfSample = new GltfScene( AssetsPath("webgl/Lu_Scene_recorded.gltf"), this )
    // this.gltfSample = new GltfScene( AssetsPath("webgl/black_honey_robotic_arm/scene.gltf"), this )
    this.gltfSample = new GltfScene( AssetsPath("webgl/suzanne/Suzanne.gltf"), this )

    this.meetmats = new Meetmats(this)
  }

  preRender():void {
    this.gltfSample.preRender()
    
    return
    for (const node of this.gltfSample.gltf.nodes ) {
      if( node.renderable )
        DebugDraw.drawText( node.name, node._wposition as vec3 )
        DebugDraw.drawGuizmo( node._wmatrix )
    }

    const n = this.gltfSample.gltf.getNode( "Object_92" )
    const meshr = n.renderable as MeshRenderer
    const posAttrib = meshr.mesh.primitives[0].attributes.getSemantic( 'POSITION' )
    const paccessor = posAttrib.accessor
    const V3 = vec3.create()
    // console.log(paccessor.count);
    
    for (let i = 0; i < paccessor.count; i++) {
      paccessor.getValue( V3, i )
      vec3.transformMat4( V3, V3, n._wmatrix )
      DebugDraw.drawText( i+"", V3 )
    }
  }

  rttPass():void {
    0
  }

  render( context: IRenderContext ):void {
    this.gltfSample.render( context )
    this.meetmats.render( context )

  }

  async load() :Promise<void> {
    await this.lighting.load()
    await this.gltfSample.load()
    await this.meetmats.load()

    if( this.gltfSample.gltf.animations[0] ){
      this.gltfSample.playAnimation(  this.gltfSample.gltf.animations[0].name )
    }
  }

}