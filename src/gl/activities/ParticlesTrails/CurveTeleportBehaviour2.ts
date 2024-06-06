import { vec3 } from "gl-matrix";
import { CurlNoise } from "../../wgsl/CurlNoise";
import GpuCurves, { type CurveBehaviour } from "./GpuCurves";
import { WGSL_CurveStructsDecl } from "./GpuCurves";
import WgslSource from "../../core/WgslSource";
import type { PointCloudData } from "./pcs/PointCloudData";
import Time from "../../core/Time";
import { SimplexNoise } from "../../wgsl/SimplexNoise";
import { easeInOutCubic, easeInOutQuad } from "../../math/ease";
import type { Uniform } from "../../core/Uniforms";

const V3A = vec3.create()
const V3B = vec3.create()






const WGSL_UpdateCursorsCurve = (numAnchors: number, numCurves: number) =>

  // ${SimplexNoise}
/* wgsl */`
const numAnchors: u32 = ${numAnchors};
const numCurves: u32 = ${numCurves};

override C_workgroup_X: u32 = ${numCurves};

struct MotionData {
  progress: f32,
  time: f32,
  reserved1: f32,
  reserved2: f32,
};

struct CursorData {
  p1: vec3f,
  n1: vec3f,
  p2: vec3f,
  n2: vec3f,
};

${WGSL_CurveStructsDecl(numAnchors)}
${SimplexNoise}

@group(0) @binding(0) var<storage, read_write> cursors: array<Anchor>;
@group(0) @binding(1) var<storage> cursorDatas: array<CursorData>;
@group(0) @binding(2) var<uniform> motionDatas: MotionData;



fn bezier( t: f32, p0: vec3f, p1: vec3f, p2: vec3f, p3: vec3f ) -> vec3f {
  var t2 = t * t;
  var one_minus_t = 1.0 - t;
  var one_minus_t2 = one_minus_t * one_minus_t;
  return p0 * one_minus_t2 * one_minus_t + p1 * 3.0 * t * one_minus_t2 + p2 * 3.0 * t2 * one_minus_t + p3 * t2 * t;

}

const UP = vec3f(0.0, 1.0, 0.0);

@compute @workgroup_size(C_workgroup_X)
fn updateCursors(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let data = cursorDatas[globalId.x];

  // var pos = mix( data.p1, data.p2, motionDatas.progress );
  var nfactor = 1.0;
  var pos = bezier( motionDatas.progress, data.p1, data.p1 + data.n1*nfactor, data.p2 + data.n2*nfactor, data.p2 );

  pos += snoise3D( pos * .5 ) * 0.1;
  var tangent = normalize( data.p2 - data.p1 );

  cursors[globalId.x].p = vec4f( pos, motionDatas.time );
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









export default class CurveTeleportBehaviour2 implements CurveBehaviour {

  private cursors : Float32Array

  animateCurvesSource: WgslSource;
  animateCurveBindGroup: GPUBindGroup;
  animateCurvesPipeline: GPUComputePipeline | null = null;


  updateCursorsSource: WgslSource;
  updateCursorsBindGroup: GPUBindGroup;
  updateCursorsPipeline: GPUComputePipeline | null = null;

  translation = vec3.create()

  cursorsDataBuffer: GPUBuffer
  // uniformsBuffer: GPUBuffer
  // uniformsData = new Float32Array(4)
  progress = 0;

  currentPos = vec3.create()
  motionData: Uniform;

  constructor( private device: GPUDevice, private curves: GpuCurves ) {
    
    // this.uniformsBuffer = device.createBuffer({
    //   label: "CurveTeleportBehaviour2 Uniforms Buffer",
    //   size: 16,
    //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    // })
    
    this.cursors = new Float32Array(curves.numCurves * 4 * 3)

    this.cursorsDataBuffer = device.createBuffer({
      label: "CurveTeleportBehaviour2 Cursors data Buffer",
      size: curves.numCurves * 16 * 4, // vec4f
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })

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
    this.motionData = this.updateCursorsSource.createUniform( 'motionDatas' )
    
    this.updateCursorsBindGroup = this.updateCursorsSource.createBindGroup( 0, [
      { binding: 0, resource: { buffer: this.curves.cursorsBuffer } },
      { binding: 1, resource: { buffer: this.cursorsDataBuffer } },
      { binding: 2, resource: { buffer: this.motionData.getBuffer() } },
    ])

    this.updateCursorsSource.createComputePipelineAsync('updateCursors', {
      constants: {
        C_workgroup_X: this.curves.perCurvesDispatch[1],
      }
    }).then(pipeline => {
      this.updateCursorsPipeline = pipeline
    })


  }


  init( to: vec3, pc: PointCloudData, dataOffset: number ) {

    const from = this.currentPos

    if( pc.positions.length < this.curves.numCurves + dataOffset ) {
      throw new Error('Not enough points in point cloud')
    }

    console.log('init teleport', from, to)

    vec3.sub( this.translation, to, from )

    const c = this.cursors

    for( let i = 0; i < this.curves.numCurves; i++ ){
      const j = i*16
      const p = pc.positions[i+dataOffset]
      const n = pc.normals[i+dataOffset]


      c[j+0] = p[0]+from[0]
      c[j+1] = p[1]+from[1]
      c[j+2] = p[2]+from[2]

      c[j+4] = n[0]
      c[j+5] = n[1]
      c[j+6] = n[2]

      c[j+8] = p[0]+to[0]
      c[j+9] = p[1]+to[1]
      c[j+10] = p[2]+to[2]

      c[j+12] = n[0]
      c[j+13] = n[1]
      c[j+14] = n[2]

    }

    this.progress = 0
    this.device.queue.writeBuffer( this.cursorsDataBuffer, 0, this.cursors )
    
    this.curves.reset()


    vec3.copy( this.currentPos, to )
  }
  
  updateCursors(pass: GPUComputePassEncoder): void {
    if( this.updateCursorsPipeline === null ) return
    
    this.progress += Time.dt * 3
    this.progress = Math.min(1, this.progress)

    this.motionData.member('progress').value = easeInOutQuad(this.progress)
    this.motionData.member('time').value = performance.now() * 0.00001
    // this.uniformsData[0] = easeInOutQuad(this.progress)
    // this.uniformsData[1] = performance.now() * 0.00001
    
    this.motionData._update()

    pass.setPipeline(this.updateCursorsPipeline)
    pass.setBindGroup(0, this.updateCursorsBindGroup)
    pass.dispatchWorkgroups(this.curves.perCurvesDispatch[0])
  }

  animateCurve(pass: GPUComputePassEncoder): void {
    if( this.animateCurvesPipeline === null ) return

    // pass.setPipeline(this.animateCurvesPipeline)
    // pass.setBindGroup(0, this.animateCurveBindGroup)
    // pass.dispatchWorkgroups(this.curves.perAnchorsDispatch[0], this.curves.perAnchorsDispatch[1])

  }

}