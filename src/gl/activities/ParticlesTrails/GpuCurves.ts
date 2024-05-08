import type { AnyPromise } from "../../../utils/AnyPromise";
import { CameraBindGroupFactory } from "../../core/BindGroup";
import WgslSource from "../../core/WgslSource";
import type { IRenderable } from "../../renderer/Renderable";
import type Renderer from "../../renderer/Renderer";

const ANCHOR_BYTE_SIZE = 4 * 4; // vec4f
const CURVE_META_BYTE_SIZE = 4 * 4; // vec4u


const WGSL_CurveStructsDecl = (numAnchors: number) =>

/* wgsl */`

struct Anchor {
  p: vec4<f32>
}


struct CurveInfos {
  start: u32,
  length: u32,
  reserved0: u32,
  reserved1: u32,
}

struct Curve {
  infos: CurveInfos,
  anchors: array<Anchor, ${numAnchors}>,
}
`

const WGSL_UpdateCurves = (numAnchors: number, numCurves: number) =>
/* wgsl */`
override numCurves: u32 = ${numCurves};
override segmentLength = 0.1;
override numAnchors: u32 = 128;

${WGSL_CurveStructsDecl(numAnchors)}

@group(0) @binding(0) var<storage, read> cursors: array<Anchor>;
@group(0) @binding(1) var<storage, read_write> curves: array<Curve>;

fn curvePtr( index: u32 ) -> u32 {
  return index % numAnchors;
}

fn MakeAnchor( p: vec3<f32> ) -> Anchor {
  return Anchor( vec4<f32>( p, 0.0 ) );
}

@compute @workgroup_size(numCurves)
fn updateCurves(@builtin(global_invocation_id) globalId: vec3<u32>) {
  
  let curve = &curves[globalId.x];
  let anchors = &curve.anchors;
  let infos = &curve.infos;
  let cursor = cursors[globalId.x];

  var start = infos.start;
  var length = infos.length;

  if( length == 0 ){

    start = 0;
    length = 4;
    anchors[0] = cursor;
    anchors[1] = cursor;
    anchors[2] = cursor;
    anchors[3] = cursor;
  } 
  else {

    var currPtr = curvePtr(start + length - 3);

    var currentPos = anchors[ currPtr ].p.xyz;
    var dist = distance( cursor.p.xyz, currentPos );

    loop {
      var ptr2 = curvePtr(currPtr + 1);
      var ptr3 = curvePtr(currPtr + 2);

      var dir = normalize( cursor.p.xyz - currentPos );

      if( length == 4 ){
        var a = MakeAnchor( currentPos - dir * segmentLength );
        anchors[0] = a;
      }

      var b = MakeAnchor( currentPos + dir * segmentLength );
      anchors[ ptr2 ] = b;

      var c = MakeAnchor( currentPos + dir * 2.0 * segmentLength );
      anchors[ ptr3 ] = c;

      if( dist > segmentLength ){
        var d = MakeAnchor( currentPos + dir * 3.0 * segmentLength );
        anchors[ curvePtr(currPtr + 3) ] = d;
        currPtr = ptr2;
        currentPos = b.p.xyz;
        dist = distance( cursor.p.xyz, currentPos );
   
        length++;
      }
      else {
        break;
      }
    }

    if( length >= numAnchors ){
      start = curvePtr( currPtr + 3 );
      length = numAnchors;
    }

    
  }
  infos.start = start;
  infos.length = length;
  // curve.infos = CurveInfos( start, length, 0, 0 );
}
`


const WGSL_DebugAnchors = (numAnchors: number) =>
  /* wgsl */`

${CameraBindGroupFactory.getWgslDeclaration(0)}
${WGSL_CurveStructsDecl(numAnchors)}

fn curvePtr( index: u32 ) -> u32 {
  return index % ${numAnchors};
}

@group(1) @binding(0) var<storage> curves: array<Curve>;

@vertex
fn vertexMain( 
  @builtin(vertex_index) anchorIndex: u32,
  @builtin(instance_index) curveIndex: u32 
) -> @builtin(position) vec4f {
  let infos = curves[curveIndex].infos;
  var i = curvePtr( min( anchorIndex, infos.length - 1 ) + infos.start );
  var pos = curves[curveIndex].anchors[i].p.xyz;
  // pos += vec3<f32>(f32(anchorIndex)*0.01, f32(curveIndex)*0.01, 0.0);

  return camera.viewProj * vec4f( pos, 1.0 );
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
  return vec4f(0.0, 1.0, 0.0, 1.0);
}

`

export default class GpuCurves implements IRenderable {

  private cursorsBuffer: GPUBuffer
  private anchorsBuffer: GPUBuffer
  private cubicCoeffBuffer: GPUBuffer

  private cursorsData: Float32Array;

  readonly numSegments: number
  private updateCurvesSource: WgslSource
  private debugAnchorsSource: WgslSource
  private updateCurveBindGroup: GPUBindGroup
  private debugAnchorsBindGroup: GPUBindGroup 

  private updateCurvesPipeline!: GPUComputePipeline
  private debugAnchorsPipeline!: GPURenderPipeline


  constructor(private device: GPUDevice, readonly numCurves = 64, readonly numAnchors = 128, readonly segmentLength = 0.1) {

    this.numSegments = numAnchors - 3;

    this.cursorsData = new Float32Array(numCurves * ANCHOR_BYTE_SIZE / 4)

    this.cursorsBuffer = device.createBuffer({
      label: "GpuCurves Cursors Buffer",
      size: numCurves * ANCHOR_BYTE_SIZE, // vec4f
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })

    this.anchorsBuffer = device.createBuffer({
      label: "GpuCurves Anchors Buffer",
      size: numCurves * (numAnchors * ANCHOR_BYTE_SIZE + CURVE_META_BYTE_SIZE), // vec4f
      usage: GPUBufferUsage.STORAGE
    })

    this.cubicCoeffBuffer = device.createBuffer({
      label: "GpuCurves Cubic Coeff Buffer",
      size: numCurves * (numAnchors * 4 * 4 * 4), // vec4f
      usage: GPUBufferUsage.STORAGE
    })

    this.updateCurvesSource = new WgslSource(device, WGSL_UpdateCurves(numAnchors, numCurves), 'GpuCurves UpdateCurves')
    this.debugAnchorsSource = new WgslSource(device, WGSL_DebugAnchors(numAnchors), 'GpuCurves DebugAnchors')

    this.updateCurveBindGroup = this.device.createBindGroup({
      layout: this.updateCurvesSource.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.cursorsBuffer } },
        { binding: 1, resource: { buffer: this.anchorsBuffer } },
      ]
    })

    this.debugAnchorsBindGroup = this.device.createBindGroup({
      layout: this.debugAnchorsSource.getBindGroupLayout(1),
      entries: [
        { binding: 0, resource: { buffer: this.anchorsBuffer } },
      ]
    })

    this.ready = Promise.all([

      this.updateCurvesSource.createComputePipelineAsync('updateCurves', {
        constants: {
          numCurves,
          segmentLength,
          numAnchors,
        }
      }).then(pipeline => {
        this.updateCurvesPipeline = pipeline
      }),

      this.debugAnchorsSource.createRenderPipelineAsync({
        primitive: {
          topology: 'line-strip'
        },
      }, 'vertexMain', 'fragmentMain'
      ).then(pipeline => {
        this.debugAnchorsPipeline = pipeline
      })

    ])


  }

  setCursors(cursors: Float32Array): void {
    this.cursorsData.set(cursors)
  }

  setAllCursors(cursor: Float32Array): void {
    for (let i = 0; i < this.numCurves; i++) {
      this.cursorsData.set(cursor, i * ANCHOR_BYTE_SIZE / 4)
    }
  }


  ready?: AnyPromise | undefined;

  dispose(): void {

  }

  addedToRenderer(renderer: Renderer): void {

    renderer.defaultPass.beforeRender(() => {

      // update cursors buffer here
      
      const encoder = this.device.createCommandEncoder({ label: 'GpuCurves compute command encoder' })
      const pass = encoder.beginComputePass({ label: 'GpuCurves compute pass' });
      
      pass.setPipeline(this.updateCurvesPipeline)
      pass.setBindGroup(0, this.updateCurveBindGroup)
      pass.dispatchWorkgroups(1)
      pass.end()
      
      this.device.queue.writeBuffer(this.cursorsBuffer, 0, this.cursorsData)
      this.device.queue.submit([encoder.finish()])

    })

    renderer.defaultPass.addCommands( (ctx)=>{
       
      const encoder = ctx.encoder;
      encoder.setPipeline(this.debugAnchorsPipeline);
      encoder.setBindGroup(0, ctx.cameraBindGroup.getBindGroup());
      encoder.setBindGroup(1, this.debugAnchorsBindGroup );
      encoder.draw( this.numAnchors, this.numCurves, 0, 0 );
    })
  }


}