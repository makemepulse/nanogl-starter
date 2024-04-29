import WgslSource from "../../core/WgslSource";
import type CatmullCurve from "./CatmullCurve";


export const CubicCurveSegmentDecl = /* wgsl */`

struct CubicCurveSegment {
  coeffA: vec4f,
  coeffB: vec4f,
  coeffC: vec4f,
  coeffD: vec4f
}
`
export const CurveParamsDecl = /* wgsl */`

struct CurveParams {
  startIndex: u32,
  maxAlloc: u32,
  numAnchors: u32
}
`


const WGSL = /* wgsl */`
override C_workgroup_size = 128;



${CubicCurveSegmentDecl}
${CurveParamsDecl}

@group(0) @binding(0) var<storage, read> anchors: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> segments: array<CubicCurveSegment>;
@group(0) @binding(2) var<uniform> curveParams: CurveParams;


fn computeSegment( a: vec4f, b: vec4f, c: vec4f, d: vec4f ) -> CubicCurveSegment {
  // return catmull-rom cubic coefficients from 4 points
  return CubicCurveSegment(
    b,
    0.5*(c-a),
    a - 2.5*b + 2.0*c - 0.5*d,
    0.5*(d-a) + 1.5*( b-c )
  );
}

@compute @workgroup_size(C_workgroup_size)
fn computeSegments(@builtin(global_invocation_id) gloablId: vec3u) {
  if( gloablId.x >= curveParams.maxAlloc - 3 ) {
    return;
  }
  var index = gloablId.x+ curveParams.startIndex;
  segments[gloablId.x] = computeSegment( anchors[index], anchors[index+1], anchors[index+2], anchors[index+3] );
}

`


export default class WgslParametricCurve extends WgslSource {

  static readonly BYTES_PER_SEGMENT = 4*4*4

  constructor( device : GPUDevice ) {
    super(device, WGSL, 'WgslParametricCurve')
    this.createComputePipelineAsync
  }

  createComputeSegmentPipelineAsync( maxSegments: number ): Promise<GPUComputePipeline> {
    return this.createComputePipelineAsync('computeSegments', { constants: {C_workgroup_size: maxSegments }})
  }

  createBindGroup( curve: CatmullCurve, segments: GPUBuffer ): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.getBindGroupLayouts()[0],
      entries: [
        { binding: 0, resource: { buffer: curve.buffer } },
        { binding: 1, resource: { buffer: segments } },
        { binding: 2, resource: { buffer: curve.parambuffer } }
      ]
    })
  }
}
