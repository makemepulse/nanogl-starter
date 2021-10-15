
import { quat } from 'gl-matrix';
import Accessor from './Accessor'
import Gltf2 from '../types/Gltf2';
import GltfLoader from '../io/GltfLoader';
import GltfTypes from '../types/GltfTypes';
import { IElement } from '../types/Elements';
import { TypedArray } from '../types/TypedArray';



type LerpFunc = (out:TypedArray, a:TypedArray, b:TypedArray, p:number )=>void;





function cubicSplineInterpolation(out: TypedArray, t: number, dt: number, v0: TypedArray, b0: TypedArray, a1: TypedArray, v1: TypedArray ) {

  const t2 = t * t;
  const t3 = t * t2;

  const f0 = 2.0 * t3 - 3.0 * t2 + 1.0;
  const f1 = dt * (t3 - 2.0 * t2 + t);
  const f2 = 3.0 * t2 - 2.0 * t3;
  const f3 = dt * (t3 - t2);

  const ncomps = v0.length;

  for (let i = 0; i < ncomps; i++) {
    out[i] = f0 * v0[i] + f1 * b0[i] + f2 * v1[i] + f3 * a1[i];
  }

}



class SampleInterval {


  frame   : number;
  t0      : number;
  t1      : number;
  inBound : boolean;
  _fMax   : number;


  constructor(input:Accessor) {
    this.frame = 0;
    this.t0 = input.getRawScalar(0);
    this.t1 = input.getRawScalar(1);
    this.inBound = true;
    this._fMax = input.count-1;
  }


  contain(t:number):number {
    if (t < this.t0) return -1
    if (t >= this.t1) return 1;
    return 0;
  }


  normalizedFrame():number{
    return Math.min( Math.max( this.frame, 0 ) , this._fMax );
  }


}



class Interpolator {


  sampler : AnimationSampler;
  interval: SampleInterval  ;

  /**
   * number of element to fetch in output accessor
   * primarily used to fetch morph weights
   */
  numElements: number;


  constructor(sampler:AnimationSampler, numElements : number ) {
    this.sampler = sampler;
    this.interval = new SampleInterval(sampler.input);
    this.numElements = numElements;
  }


  resolveInterval(t:number) {
    // TODO: optimize 
    // test time bounds
    // binary search but test few frame around interval cache first

    const interval = this.interval;
    const input = this.sampler.input;
    const numFrames = input.count;

    const contain = interval.contain(t);

    // the current interval already contain t
    if (contain === 0) return;



    let frame;
    let t1;
    let t0;
    let inBound = true;


    if (contain > 0) {

      frame = interval.frame + 1;
      t1 = interval.t1;

      do {
        frame++;
        inBound = (frame < numFrames);
        t0 = t1;
        t1 = inBound ? input.getRawScalar(frame) : Number.MAX_VALUE;
      } while (t1 <= t );

      frame--;

    }
    else {

      frame = interval.frame;
      t0 = interval.t0;

      do {
        frame--;
        inBound = (frame >= 0);
        t1 = t0;
        t0 = inBound ? input.getRawScalar(frame) : -Number.MAX_VALUE;
      } while (t0 > t );

    }

    interval.frame = frame
    interval.t0 = t0
    interval.t1 = t1
    interval.inBound = inBound;


  }


  evaluate(out:TypedArray, t:number) {
    //abstract
  }


}


class StepInterpolator extends Interpolator {

  evaluate(out:TypedArray, t:number) {
    this.resolveInterval(t);
    this.sampler.output.getValues(out, this.interval.normalizedFrame()*this.numElements, this.numElements);
  }

}




function LERP_N(out:TypedArray, a:TypedArray, b:TypedArray, p:number ){
  const n = a.length;
  const invp = 1.0 - p;
  for (let i = 0; i < n; i++) {
    out[i] = a[i] * invp + b[i] * p;
  }
}

function LERP1( out:TypedArray, a:TypedArray, b:TypedArray, p:number ){
  out[0] = a[0] * (1.0 - p) + b[0] * p;
}

function getLerpFunction( path : Gltf2.AnimationChannelTargetPath, numComps : number ) : LerpFunc {

  switch (path) {
    case Gltf2.AnimationChannelTargetPath.WEIGHTS:
      return (numComps===1) ? LERP1 : LERP_N;
    case Gltf2.AnimationChannelTargetPath.ROTATION:
      return quat.slerp as unknown as LerpFunc;
        
    case Gltf2.AnimationChannelTargetPath.SCALE:
    case Gltf2.AnimationChannelTargetPath.TRANSLATION:
    default:
        return LERP_N;
  }

}




class LinearInterpolator extends Interpolator {

  val0 : TypedArray;
  val1 : TypedArray;
  lerpFunc : LerpFunc;

  constructor(sampler : AnimationSampler, path : Gltf2.AnimationChannelTargetPath, numElements : number) {
    super(sampler, numElements);
    this.val0 = sampler.output.createElementHolderArray(numElements);
    this.val1 = sampler.output.createElementHolderArray(numElements);
    this.lerpFunc = getLerpFunction( path, this.val0.length);
  }

  evaluate(out:TypedArray, t:number) {
    this.resolveInterval(t);

    const output = this.sampler.output;
    const ne = this.numElements
    if (this.interval.inBound) {
      const { t0, t1, frame } = this.interval;
      const p = (t - t0) / (t1 - t0);

      output.getValues(this.val0, ne*frame + 0,  ne);
      output.getValues(this.val1, ne*frame + ne, ne);
      this.lerpFunc(out, this.val0, this.val1, p);

    } else {
      output.getValues(out, this.interval.normalizedFrame()*ne, ne);
    }
  }

}



// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation

class CubicSplineInterpolator extends Interpolator {


  val0 : TypedArray;
  val1 : TypedArray;
  val2 : TypedArray;
  val3 : TypedArray;

  assumeQuat : boolean;

  constructor(sampler : AnimationSampler, path : Gltf2.AnimationChannelTargetPath, numElements : number) {
    super(sampler, numElements);
    this.val0 = sampler.output.createElementHolderArray(numElements);
    this.val1 = sampler.output.createElementHolderArray(numElements);
    this.val2 = sampler.output.createElementHolderArray(numElements);
    this.val3 = sampler.output.createElementHolderArray(numElements);
    this.assumeQuat = path === Gltf2.AnimationChannelTargetPath.ROTATION
  }

  evaluate(out:TypedArray, t:number) {
    this.resolveInterval(t);

    const output = this.sampler.output;
    const ne = this.numElements
    if (this.interval.inBound) {

      const { t0, t1, frame } = this.interval;
      const dt = t1 - t0
      const p = (t - t0) / dt;

      output.getValues(this.val0, ne*(frame * 3 + 1), ne);
      output.getValues(this.val1, ne*(frame * 3 + 2), ne);
      output.getValues(this.val2, ne*(frame * 3 + 3), ne);
      output.getValues(this.val3, ne*(frame * 3 + 4), ne);


      cubicSplineInterpolation(out, p, dt, this.val0, this.val1, this.val2, this.val3);

      if (this.assumeQuat) {
        quat.normalize(<quat>out, <quat>out);
      }


    } else {
      output.getValues(out, ne*(this.interval.normalizedFrame() * 3 + 1), ne);
    }
  }

}





function InterpolatorFactory(sampler:AnimationSampler, path : Gltf2.AnimationChannelTargetPath, numElements : number ) : Interpolator {
  switch (sampler.interpolation) {
    case Gltf2.AnimationSamplerInterpolation.STEP:
      return new StepInterpolator(sampler, numElements);
    case Gltf2.AnimationSamplerInterpolation.LINEAR:
      return new LinearInterpolator(sampler, path, numElements);
    case Gltf2.AnimationSamplerInterpolation.CUBICSPLINE:
      return new CubicSplineInterpolator(sampler, path, numElements);

    default:
      throw new Error('GLTF : Unsupported sampler interpolation ' + sampler.interpolation);
  }
}







export class SamplerEvaluator {

  sampler: AnimationSampler;
  numElements: number;
  interpolator: Interpolator;

  constructor( sampler : AnimationSampler, path : Gltf2.AnimationChannelTargetPath, numElements : number ){
    this.sampler = sampler;
    this.numElements = numElements;
    this.interpolator  = InterpolatorFactory( sampler, path, numElements );
  }

  evaluate(out:TypedArray, t:number) {
    this.interpolator.evaluate( out, t );
  }

  createElementHolder():TypedArray {
    return this.sampler.output.createElementHolderArray( this.numElements );
  }

}



export default class AnimationSampler implements IElement {

  readonly gltftype : GltfTypes.ANIMATION_SAMPLER = GltfTypes.ANIMATION_SAMPLER

  name        : undefined | string;
  extras      : any   ;


  interpolation :Gltf2.AnimationSamplerInterpolation ;
  input         :Accessor          ;
  output        :Accessor          ;

  minTime  = 0;
  maxTime  = 0;

  async parse( gltfLoader:GltfLoader, data:Gltf2.IAnimationSampler ) : Promise<any> {

    this.input  = await gltfLoader.getElement( GltfTypes.ACCESSOR, data.input );
    this.output = await gltfLoader.getElement( GltfTypes.ACCESSOR, data.output );

    this.interpolation = data.interpolation || Gltf2.AnimationSamplerInterpolation.LINEAR;

    this.minTime = this.input.getRawScalar(0);
    this.maxTime = this.input.getRawScalar(this.input.count-1);
  }


  createEvaluator( path: Gltf2.AnimationChannelTargetPath, numElements : number ):SamplerEvaluator {
    return new SamplerEvaluator( this, path, numElements );
  }

}
