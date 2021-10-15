import Node from "../elements/Node"
import Mesh from "../elements/Mesh"
import Primitive from "../elements/Primitive"
import GLConfig from 'nanogl-state/config'
import Camera from 'nanogl-camera'
import BaseMaterial from 'nanogl-pbr/BaseMaterial'
import DepthPass from 'nanogl-pbr/DepthPass'
import MorphDeformer from 'nanogl-pbr/MorphDeformer'
import SkinDeformer, { SkinAttributeSet } from 'nanogl-pbr/SkinDeformer'
import { GLContext } from "nanogl/types"
import Assert from "../lib/assert"
import Program from "nanogl/program"
import IRenderable, { IRenderingContext } from "./IRenderable"
import Bounds from "nanogl-pbr/Bounds"
import { MorphAttributeType, MorphAttribInfos, MorphAttributeName } from "nanogl-pbr/MorphCode"
import DepthFormat from 'nanogl-pbr/DepthFormatEnum';




function assertIsNumComps( n : number ) : asserts n is 1|2|3|4 {
  if( n<1 || n>4 ) throw new Error('number is not Component size')
}

function assertSemanticCanBeMorphed( s : string ) : asserts s is MorphAttributeName {
  if( s !== 'position' && s !== 'normal' && s !== 'tangent' ) throw new Error(`semantic ${s} can't be morphed`)
}




export default class MeshRenderer implements IRenderable {

  
  readonly node: Node;
  readonly mesh: Mesh;
  
  materials : BaseMaterial[] = []
  
  glconfig? : GLConfig;

  readonly bounds : Bounds = new Bounds();


  private _skin : SkinDeformer;
  private _morph : MorphDeformer;
  
  constructor( gl : GLContext, node: Node) {
    Assert.isDefined( node.mesh );
    this.node = node;
    this.mesh = node.mesh;
    
    this.setupMaterials( gl );
    this.computeBounds();
  }
  
  /**
   * for each primitives, create a material based on primitive's material pass
   * if skin or morph target are present, deformers are set on the created material
   * TODO: if no deformer, a single material instance can be shared between renderers
   */
  setupMaterials(gl : GLContext) {
    for (const primitive of this.mesh.primitives ) {
      const material = primitive.material.createMaterialForPrimitive( gl, this.node, primitive );
      const dp = new DepthPass( gl );
      dp.depthFormat.set("D_DEPTH");
      material.addPass( dp, 'depth' );
      this.configureDeformers( material, primitive );
      this.materials.push( material );
    }

  }

  configureDeformers(material: BaseMaterial, primitive: Primitive) {
    this.configureSkin ( material, primitive );
    this.configureMorph( material, primitive );
  }

  configureMorph(material: BaseMaterial, primitive: Primitive) {

    if( primitive.targets !== null ){
      
      // console.log("CONFIGURING MORPH : ", primitive);
      const morphedAttribs = primitive.targets[0].attributes;
      const morphInfos : MorphAttribInfos[] = [];
      
      for (const morphedattrib of morphedAttribs) {
        
        const miAttributes = primitive.targets.map( (target)=>{
          return target.getSemantic( morphedattrib.semantic ).glslname
        });
        
        const aname : string = morphedattrib.semantic.toLowerCase()
        assertSemanticCanBeMorphed( aname );
        
        const morphInfo :MorphAttribInfos = {
          name : aname,
          type : morphedattrib.accessor.glslType as MorphAttributeType,
          attributes : miAttributes,
        }
        
        morphInfos.push( morphInfo );
      }
      
      const morphDeformer = new MorphDeformer( morphInfos );
      

      material.inputs.add( morphDeformer );
      this._morph = morphDeformer;

      this.setupMorphWeights();
    }
    
  
  }
  setupMorphWeights() {
    if( this.node.weights ){
      this._morph.weights = this.node.weights 
    } else if( this.mesh.weights ){
      this._morph.weights = this.mesh.weights 
    }
  }

  configureSkin(material: BaseMaterial, primitive: Primitive) {
    
    if( this.node.skin ){
      
      const numJoints = this.node.skin.joints.length;

      const attributeSet : SkinAttributeSet[] = [];
      
      let setIndex = 0
      while( true ){

        const wsem = 'WEIGHTS_'+setIndex;
        const jsem = 'JOINTS_' +setIndex;
        const weights = primitive.attributes.getSemantic( wsem );
        const joints  = primitive.attributes.getSemantic( jsem );
        
        if( (weights === null) !== (joints === null) ){
          throw new Error('Skin attributes inconsistency')
        }

        if( weights === null ) break;
        
        if( weights.accessor.numComps !== joints.accessor.numComps){
          throw new Error('weight and joints attribute dont have the same size')
        }

        const numComponents = weights.accessor.numComps;
        assertIsNumComps( numComponents );

        attributeSet.push({
          weightsAttrib : weights.glslname,
          jointsAttrib  : joints .glslname,
          numComponents
        })
        setIndex++;
      }

      const skinDeformer = new SkinDeformer(numJoints, attributeSet)
      // add skin deformer
      //material.setSkin ...
      material.inputs.add( skinDeformer );
      this._skin = skinDeformer;
    }
    
  }

  computeBounds() {
    this.bounds.copyFrom( this.mesh.primitives[0].bounds )
    for (const primitive of this.mesh.primitives ) {
      Bounds.union( this.bounds, this.bounds, primitive.bounds );
    }
  }

  

  render( context:IRenderingContext, camera:Camera, mask:number, passId : string,  glconfig?:GLConfig ) : void {

    const glstate = context.glstate;

    const primitives = this.mesh.primitives;
    
    if( this._skin ){
      this.node.skin.computeJoints( this.node, this._skin.jointMatrices );
    }

    if (this._morph ){
      this.setupMorphWeights();
    }


    for (let i = 0; i < primitives.length; i++) {

      const primitive = primitives[i];
      const mat:BaseMaterial = this.materials[i];
      
      if ( !mat.hasPass( passId ) || (mat.mask & mask) === 0)  continue;
      
      const passInstance = mat.getPass( passId );
      
      if ((passInstance.pass.mask & mask) === 0) continue;

      passInstance.prepare( this.node, camera )


      // push configs
      // -------------


      glstate.push( passInstance.pass.glconfig );
      mat.glconfig  && glstate.push(mat.glconfig);
      this.glconfig && glstate.push(this.glconfig);
      glconfig      && glstate.push(glconfig);
      
      glstate.apply()
      
      // render
      // ----------
      this.drawCall(camera, passInstance.getProgram(), primitive);
      
      // pop configs
      // -------------
      
      glstate.pop();
      mat.glconfig  && glstate.pop();
      this.glconfig && glstate.pop();
      glconfig      && glstate.pop();

    }

  }


  drawCall( camera:Camera, prg:Program, sub:Primitive ) {
    sub.bindVao( prg );
    sub.render();
    sub.unbindVao();
  }


}