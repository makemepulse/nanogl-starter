
import AnimationSampler, { SamplerEvaluator } from './AnimationSampler'
import Node from './Node'
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';
import { TypedArray } from '../types/TypedArray';

type applyFunc = (node:Node, value:TypedArray)=>void





type PathType = 'translation' | 'rotation' | 'scale' | 'weights' | string;


function applyTranslation(node:Node, value:TypedArray) {
  node.position.set( value );
  node.invalidate();
}

function applyRotation(node:Node, value:TypedArray) {
  node.rotation.set( value );
  node.invalidate();
}

function applyScale(node:Node, value:TypedArray) {
  node.scale.set( value );
  node.invalidate();
}

function applyWeights(node:Node, value:TypedArray) {
  node.weights.set( value );
}


function getApplyFunctionFromPath(path:PathType):applyFunc {
  switch (path) {
    case Gltf2.AnimationChannelTargetPath.TRANSLATION:
      return applyTranslation;
    case Gltf2.AnimationChannelTargetPath.ROTATION:
      return applyRotation;
    case Gltf2.AnimationChannelTargetPath.SCALE:
      return applyScale;
    case Gltf2.AnimationChannelTargetPath.WEIGHTS:
      return applyWeights;
    default:
      throw new Error('unsupported path ' + path);
  }
}


export default class AnimationChannel implements IElement {

  readonly gltftype : GltfTypes.ANIMATION_CHANNEL = GltfTypes.ANIMATION_CHANNEL

  name        : undefined | string;
  extras      : any   ;

  _active       : boolean         ;
  sampler       : AnimationSampler;
  path          : Gltf2.AnimationChannelTargetPath        ;
  applyFunction : applyFunc       ;
  node          : Node            ;
  valueHolder   : TypedArray      ;
  evaluator     : SamplerEvaluator;


  async parse(gltfLoader:GltfLoader, data:Gltf2.IAnimationChannel) : Promise<any> {

    this._active = false;

    this.path = data.target.path;
    this.applyFunction = getApplyFunctionFromPath( this.path );
    
    if( data.target.node !== undefined ){
      this._active = true;
      this.node = await gltfLoader.getElement( GltfTypes.NODE, data.target.node);
      
      
      let numElems = 1;
      if( this.path === Gltf2.AnimationChannelTargetPath.WEIGHTS ){
        numElems = this.node.mesh.primitives[0].targets.length
      }
      
      gltfLoader._loadElement( data.elementParent ).then( animation=>{
        this.sampler = animation.getSampler(data.sampler);
        this.evaluator = this.sampler.createEvaluator( this.path, numElems )
        this.valueHolder = this.evaluator.createElementHolder();
      } );

    }

  }


  evaluate(t:number) {
    if (this._active) {
      this.evaluator.evaluate(this.valueHolder, t);
      this.applyFunction( this.node, this.valueHolder );
    }
  }


}
