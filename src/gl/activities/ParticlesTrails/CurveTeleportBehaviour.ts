import { vec3 } from "gl-matrix";
import { CurlNoise } from "../../wgsl/CurlNoise";
import GpuCurves, { type CurveBehaviour } from "./GpuCurves";
import { WGSL_CurveStructsDecl } from "./GpuCurves";
import WgslSource from "../../core/WgslSource";

const V3A = vec3.create()
const V3B = vec3.create()






const WGSL_UpdateCursorsCurve = (numAnchors: number, numCurves: number) =>

  // ${SimplexNoise}
/* wgsl */`
const numAnchors: u32 = ${numAnchors};
const numCurves: u32 = ${numCurves};

${WGSL_CurveStructsDecl(numAnchors)}
${CurlNoise}

@group(0) @binding(0) var<storage, read_write> cursors: array<Anchor>;

const UP = vec3f(0.0, 1.0, 0.0);

@compute @workgroup_size(numCurves)
fn updateCursors(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let cursor = cursors[globalId.x];

  var pos = cursor.p.xyz;
  pos += curlNoise( pos * 2.0 ) * 0.0005;
  pos += cursor.t * 0.08;

  var tangent = normalize( pos - cursor.p.xyz );
  cursors[globalId.x].p = vec4f( pos, cursor.p.w );
  cursors[globalId.x].t = tangent;
}
`







const WGSL_AnimateCurve = (numAnchors: number) =>

// ${SimplexNoise}
/* wgsl */`
const numAnchors: u32 = ${numAnchors};

override C_workgroup_X = 16;
override C_workgroup_Y = 16;

${WGSL_CurveStructsDecl(numAnchors)}
${CurlNoise}

@group(0) @binding(0) var<storage, read_write> curves: array<Curve>;


@compute @workgroup_size(C_workgroup_X, C_workgroup_Y)
fn animateCurves(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let anchors = &curves[globalId.y].anchors;
  let anchor = anchors[globalId.x];
  var pos = anchor.p.xyz;
  pos += curlNoise( pos * 2.0 ) * 0.0005;
  anchors[globalId.x].p = vec4f( pos, anchor.p.w );
}
`









export default class CurveTeleportBehaviour implements CurveBehaviour {

  private datas : Float32Array
  animateCurvesSource: WgslSource;
  animateCurveBindGroup: GPUBindGroup;
  animateCurvesPipeline: GPUComputePipeline | null = null;


  updateCursorsSource: WgslSource;
  updateCursorsBindGroup: GPUBindGroup;
  updateCursorsPipeline: GPUComputePipeline | null = null;

  constructor( private device: GPUDevice, private curves: GpuCurves ) {
    this.datas = new Float32Array(curves.numCurves * GpuCurves.ANCHOR_BYTE_SIZE / 4)


    this.animateCurvesSource = new WgslSource(device, WGSL_AnimateCurve       (curves.numAnchors                ), 'CurveTeleportBehaviour AnimateCurves'     )
    
    this.animateCurveBindGroup = this.animateCurvesSource.createBindGroup( 0, [
      { binding: 0, resource: { buffer: this.curves.anchorsBuffer } },
    ])

    this.animateCurvesSource.createComputePipelineAsync('animateCurves', {
      constants: {
        C_workgroup_X: curves.perAnchorsDispatch[2],
        C_workgroup_Y: curves.perAnchorsDispatch[3],
      }
    }).then(pipeline => {
      this.animateCurvesPipeline = pipeline
    })


    this.updateCursorsSource = new WgslSource(device, WGSL_UpdateCursorsCurve       (curves.numAnchors, curves.numCurves     ), 'CurveTeleportBehaviour Update cursors'     )
    
    this.updateCursorsBindGroup = this.updateCursorsSource.createBindGroup( 0, [
      { binding: 0, resource: { buffer: this.curves.cursorsBuffer } },
    ])

    this.updateCursorsSource.createComputePipelineAsync('updateCursors', {
    }).then(pipeline => {
      this.updateCursorsPipeline = pipeline
    })

  }


  init( center: vec3 ) {

    for( let i = 0; i < this.curves.numCurves; i++ ){
      
      this.datas[i*8+0] = center[0]
      this.datas[i*8+1] = center[1]
      this.datas[i*8+2] = center[2]
      this.datas[i*8+3] = performance.now() * 0.00001

      this.datas[i*8+4] = Math.random() - 0.5
      this.datas[i*8+5] = Math.random() - 0.5
      this.datas[i*8+6] = Math.random() - 0.5

    }

    this.device.queue.writeBuffer( this.curves.cursorsBuffer, 0, this.datas )
    this.curves.reset()
  }

  updateCursors(pass: GPUComputePassEncoder): void {
    if( this.updateCursorsPipeline === null ) return

    pass.setPipeline(this.updateCursorsPipeline)
    pass.setBindGroup(0, this.updateCursorsBindGroup)
    pass.dispatchWorkgroups(1)
  }

  animateCurve(pass: GPUComputePassEncoder): void {
    if( this.animateCurvesPipeline === null ) return

    // pass.setPipeline(this.animateCurvesPipeline)
    // pass.setBindGroup(0, this.animateCurveBindGroup)
    // pass.dispatchWorkgroups(this.curves.perAnchorsDispatch[0], this.curves.perAnchorsDispatch[1])

  }

}