import { RenderContext } from "@webgl/core/Renderer"
import Node from "nanogl-node"
import { GLContext, isWebgl2 } from "nanogl/types"
import { Uniform } from "nanogl-pbr/Input"
import { StandardMetalness } from "nanogl-pbr/StandardPass"
import SpherePrimitive from "../common/SpherePrimitive"
import Material from "nanogl-pbr/Material"
import Lighting from "@webgl/engine/Lighting"
import GLState from "nanogl-state/GLState"


/**
 * Render a grid of spheres with different roughness to preview IBLs
 */
export default class IblDevLook {


  root: Node
  sphereNode: Node
  materialPass: StandardMetalness
  material: Material

  color     : Uniform
  roughness: Uniform
  metalness : Uniform
  sphere: SpherePrimitive

  roughnessLevels = 5

  constructor(private gl: GLContext) {

    this.root = new Node()
    this.sphereNode = new Node()
    this.root.add( this.sphereNode )
    this.sphere = new SpherePrimitive(this.gl)
    this.createMaterial()

  }


  setupLighting(lighting: Lighting) {
    lighting.setupStandardPass(this.materialPass)
  }

  /**
   * create a Material for the sample sphere
   * will be rendered multiple times with various roughness values
   */
  createMaterial() {

    /**
     * create the custom clercoat pass
     */
    this.materialPass = new StandardMetalness()
    this.materialPass.glconfig
      .enableDepthTest()
      .enableCullface(true);

    // mandatory for now, shadow mapping will fail with a webgl2 context but glsl 100 shader
    this.materialPass.version.set( isWebgl2(this.gl) ? '300 es' : '100' )
    
    // manully set lightSetup on this pass since gltf will not dio it itself
    // this.lighting.setupStandardPass(this.materialPass)

    // set red color as glsl constant
    // could attach a uniform if animated, or sampler or geomatry custom attribute here
    this.color      = this.materialPass.surface.baseColor.attachUniform()
    this.roughness = this.materialPass.surface.roughness.attachUniform()
    this.metalness  = this.materialPass.surface.metalness.attachUniform()

    this.color.set(1, 1, 1)
    this.roughness.set(.25)
    this.metalness.set(0)


    this.material = new Material(this.gl)
    this.material.addPass(this.materialPass)

  }


  render(context: RenderContext): void {
    if( (context.mask & this.materialPass.mask) === 0 ) return

    const state = GLState.get(this.gl)

    const pass = this.material.getPass()
    const prg = pass.getProgram()
    this.sphere.prepare(prg)

    state.now(this.materialPass.glconfig)
    
    for( let m=0; m<=1; m++ ){
      this.metalness.set(m)
      
      for (let r = 0; r < this.roughnessLevels; r++) {
        const roughness = r / (this.roughnessLevels-1)
        
        this.roughness.set(roughness)

        this.sphereNode.setScale(.2)
        this.sphereNode.x = (r - (this.roughnessLevels-1)/2) * .5
        this.sphereNode.y = (-m + .5) * .5
        this.sphereNode.updateWorldMatrix()
        
        pass.prepare(this.sphereNode, context.camera);
        this.sphere.draw()
      }
    }

  }

}