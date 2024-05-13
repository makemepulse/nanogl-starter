import { vec3, quat } from "gl-matrix";
import Time from "../../core/Time";
import GpuCurves, { WGSL_CurveStructsDecl } from "./GpuCurves";
import type { CurveBehaviour } from "./GpuCurves";
import { CurlNoise } from "../../wgsl/CurlNoise";
import WgslSource from "../../core/WgslSource";



const WGSL_AnimateCurve = (numAnchors: number) =>

  // ${SimplexNoise}
/* wgsl */`
const numAnchors: u32 = ${numAnchors};

override C_workgroup_X = 16;
override C_workgroup_Y = 16;

${WGSL_CurveStructsDecl(numAnchors)}
${CurlNoise}

@group(0) @binding(0) var<storage, read_write> curves: array<Curve>;

const UP = vec3f(0.0, 1.0, 0.0);

@compute @workgroup_size(C_workgroup_X, C_workgroup_Y)
fn animateCurves(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let anchors = &curves[globalId.y].anchors;
  let anchor = anchors[globalId.x];
  var pos = anchor.p.xyz;
  pos += curlNoise( pos * 2.0 ) * 0.001;
  anchors[globalId.x].p = vec4f( pos, anchor.p.w );
}
`



const Q_ID = quat.create()
const Q0 = quat.create()


export default class CurvePaintBehaviour implements CurveBehaviour {

  datas : Float32Array
  cursors : vec3[] = []
  units : vec3[] = []
  animateCurvesSource: WgslSource;
  animateCurveBindGroup: GPUBindGroup;
  animateCurvesPipeline: GPUComputePipeline | null = null;

  constructor( private device: GPUDevice, private curves: GpuCurves ) {
    this.datas = new Float32Array(curves.numCurves * GpuCurves.ANCHOR_BYTE_SIZE / 4)
    
    this.datas.fill(1)
    for( let i = 0; i < curves.numCurves; i++ ){
      this.cursors.push( new Float32Array( this.datas.buffer, i*GpuCurves.ANCHOR_BYTE_SIZE, 4 ) as vec3 )
      this.units.push( vec3.fromValues(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ) )

    }

    this.animateCurvesSource = new WgslSource(device, WGSL_AnimateCurve       (curves.numAnchors                ), 'GpuCurves AnimateCurves'     )
    
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

  }


  update( center: vec3){
    quat.rotateX( Q0, Q_ID, 0.1 * Time.seconds )
    quat.rotateY( Q0, Q0, 0.16 * Time.seconds )
    quat.rotateZ( Q0, Q0, 0.23 * Time.seconds )

    for( let i = 0; i < this.cursors.length; i++ ){
      let c = this.cursors[i]
      let u = this.units[i]
      vec3.transformQuat( c, u, Q0 )
      vec3.scaleAndAdd( c, center, c, .3 )
      c[3] = performance.now() * 0.00001
    }

  }

  updateCursors(pass: GPUComputePassEncoder): void {
    this.device.queue.writeBuffer(this.curves.cursorsBuffer, 0, this.datas.buffer)
  }

  animateCurve(pass: GPUComputePassEncoder): void {
    if( this.animateCurvesPipeline === null ) return

    pass.setPipeline(this.animateCurvesPipeline)
    pass.setBindGroup(0, this.animateCurveBindGroup)
    pass.dispatchWorkgroups(this.curves.perAnchorsDispatch[0], this.curves.perAnchorsDispatch[1])

  }

}