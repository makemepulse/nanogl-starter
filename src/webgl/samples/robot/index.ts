import { RenderContext } from "@webgl/core/Renderer"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer"
import Renderer from "@webgl/Renderer"
import { IGLContextProvider } from "@webgl/resources/IGLContextProvider"
import { vec3 } from "gl-matrix"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import FloorPlane from "@webgl/engine/FloorPlane"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"


export default class RobotScene implements IGLContextProvider, IScene {

  readonly gl : GLContext
  gltfSample : GltfScene
  lighting   : Lighting
  root       : Node
  floor: FloorPlane
  
  constructor( renderer:Renderer ){
    this.gl = renderer.gl
    this.root       = new Node()
    this.lighting   = new Lighting( this.gl )
    this.gltfSample = new GltfScene( "gltfs/black_honey_robotic_arm/scene.gltf", renderer.gl, this.lighting, this.root )

    this.floor = new FloorPlane( renderer.gl )
    this.lighting.setupMaterial(this.floor.material)
    this.root.add( this.floor.node )
  }

  preRender():void {

    this.gltfSample.preRender()
    

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
      

    this.root.updateWorldMatrix()
  }

  rttPass():void {
    this.lighting.lightSetup.prepare(this.gl);
    
    
  }

  render( context: RenderContext ):void {
    this.floor.render( context )
    this.gltfSample.render( context )
  }

  async load() :Promise<void> {
    await this.lighting.load()
    await this.gltfSample.load()

    if( this.gltfSample.gltf.animations[0] ){
      this.gltfSample.playAnimation(  this.gltfSample.gltf.animations[0].name )
    }
  }

  unload(): void {
    0
  }

}