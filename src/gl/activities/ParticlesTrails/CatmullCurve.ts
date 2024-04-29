import type { vec3, vec4 } from "gl-matrix";

const FLOAT_PER_ANCHORS = 4;
const BYTES_PER_ANCHORS = FLOAT_PER_ANCHORS*4;
/**
 * max number of anchors of the curve
 */
const MAX_ANCHORS = 128
/**
 * added anchors allocation overhead
 */
const OVERHAED = 128;

const TOTAL_ALLOCATED_ANCHORS = (MAX_ANCHORS+OVERHAED);

export default class CatmullCurve{

  readonly maxAnchors = MAX_ANCHORS;
  readonly maxAlloc = TOTAL_ALLOCATED_ANCHORS;
  /**
   * number of anchors set in the curve
   */
  private _numAnchors = 0;
  public get numAnchors() {
    return this._numAnchors;
  }

  /**
   * index in achors array where the curve start
   */
  private startIndex = 0;
  
  private anchors: Float32Array;

  readonly buffer: GPUBuffer;
  readonly parambuffer: GPUBuffer;

  constructor( readonly device: GPUDevice ) {
    this.anchors = new Float32Array( TOTAL_ALLOCATED_ANCHORS*FLOAT_PER_ANCHORS );

    this.buffer = device.createBuffer({
      label: "Catmull Curve",
      size: BYTES_PER_ANCHORS * TOTAL_ALLOCATED_ANCHORS,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.parambuffer = device.createBuffer({
      label: "Catmull Curve Params",
      size: 12,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.parambuffer, 0, new Uint32Array([0, this.maxAlloc, 0]));

  }

  private _invalidRange: {start:number, length:number} = {start:0, length:0};

  invalidateRange( start:number, end:number = start ):void {
    if( this._invalidRange.length == 0 ){
      this._invalidRange.start = start;
      this._invalidRange.length = (end - start)+1;
    } else {
      this._invalidRange.start = Math.min( this._invalidRange.start, start );
      const prevEnd = this._invalidRange.start + this._invalidRange.length-1;
      this._invalidRange.length = (Math.max( prevEnd, end ) - this._invalidRange.start)+1;
    }
  }


  updateBufferIfNeeded():void {
    if( this._invalidRange.length == 0 ) return;
    console.log('update buffer', this._invalidRange.start, this._invalidRange.length);
    this.device.queue.writeBuffer(this.buffer, 0, this.anchors, this._invalidRange.start*FLOAT_PER_ANCHORS, this._invalidRange.length*FLOAT_PER_ANCHORS);
    this.device.queue.writeBuffer(this.parambuffer, 0, new Uint32Array([this.startIndex, this.maxAlloc, this.numAnchors]));
  }

  getAnchor<T extends vec3|vec4>( index:number, out:T ):T {
    const i = (index+this.startIndex)*FLOAT_PER_ANCHORS;
    out.set( this.anchors.subarray(i, i+out.length) );
    return out;
  }

  addAnchor( p:vec4|vec3 ):void {
    
    let anchorIndex = this.startIndex + this._numAnchors;
 
    if( this._numAnchors === MAX_ANCHORS ){
      this.startIndex++;
    } else {
      this._numAnchors++;
    }
    /**
     * if we reach the end of allocation buffer, we shift all the buffer to the left
     */
    if( anchorIndex >= TOTAL_ALLOCATED_ANCHORS ){
      this.anchors.copyWithin(0, this.startIndex*FLOAT_PER_ANCHORS);
      this.startIndex = 0;
      anchorIndex = this._numAnchors - 1;

      this.invalidateRange( 0, anchorIndex );
      // invalidate buffer from 0 to anchorIndex
    }
    
    this.anchors.set( p, anchorIndex*FLOAT_PER_ANCHORS )
    this.invalidateRange( anchorIndex );
  }

}