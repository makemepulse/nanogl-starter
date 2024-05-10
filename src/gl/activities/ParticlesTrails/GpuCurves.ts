import type { AnyPromise } from "../../../utils/AnyPromise";
import { CameraBindGroupFactory } from "../../core/BindGroup";
import WgslSource from "../../core/WgslSource";
import { isPOT } from "../../math";
import type { IRenderable } from "../../renderer/Renderable";
import type Renderer from "../../renderer/Renderer";
import { CurlNoise } from "../../wgsl/CurlNoise";
import { SimplexNoise } from "../../wgsl/SimplexNoise";

const ANCHOR_BYTE_SIZE = 4 * 8; // vec4f + vec3f + f32
const CURVE_META_BYTE_SIZE = 4 * 4; // vec4u


const WGSL_CurveStructsDecl = (numAnchors: number) =>

/* wgsl */`

struct Anchor {
  p: vec4f,
  t: vec3f,
  reserved0: f32,
}

struct CubicSegment {
  a: vec4<f32>,
  b: vec4<f32>,
  c: vec4<f32>,
  d: vec4<f32>,
}


struct CurveInfos {
  start: u32,
  length: u32,
  reserved0: u32,
  reserved1: u32,
}

struct Curve {
  infos: CurveInfos,
  anchors: array<Anchor, ${numAnchors+3}>,
}

struct CubicData {
  segments: array<CubicSegment, ${numAnchors}>,
}
`

/*


start 0, length 6, segs 3
anchors :    0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 0
             * X *---*---*---* X *,  ?,  ?,  ?,  ?,  ?,  ?,  ?,  ?,  ?,  ?,  
segmnts :      0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12,  13, 14, 15


start 0, length 16, segs 13
anchors :    0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 0
             * X *---*---*---*---*---*---*---*---*---*---*---*---*---* X * X
segmnts :      0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15

start 1, length 16
anchors :    0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 0
             * X * X *---*---*---*---*---*---*---*---*---*---*---*---*---* X *
segmnts :      0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15

start 2, length 16
anchors :    0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 0
          ...* X * X * X *---*---*---*---*---*---*---*---*---*---*---*---*---
segmnts :      0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15

start 6, length 16
anchors :    0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 0
        15...*---*---*---*---* X * X * X *---*---*---*---*---*---*---*---*---
segmnts :      0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13,  14, 15
seg : [7 => 15 => 0 => 3] , length 16-1 = 15, mod 16

*/ 

const WGSL_UpdateCurves = (numAnchors: number, numCurves: number) =>
/* wgsl */`
override numCurves: u32 = ${numCurves};
override segmentLength = 0.1;
override numAnchors: u32 = ${numAnchors};

const X_AXIS = vec3f(1.0, 0.0, 0.0);

${WGSL_CurveStructsDecl(numAnchors)}

@group(0) @binding(0) var<storage, read> cursors: array<Anchor>;
@group(0) @binding(1) var<storage, read_write> curves: array<Curve>;

fn curvePtr( index: u32 ) -> u32 {
  return index % numAnchors;
}

fn MakeAnchor( cursor: Anchor, p: vec3f, t: vec3f ) -> Anchor {
  return Anchor( vec4<f32>( p, cursor.p.w ), t, 0.0);
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
    anchors[0] = MakeAnchor( cursor, cursor.p.xyz, X_AXIS );
    anchors[1] = MakeAnchor( cursor, cursor.p.xyz, X_AXIS );
    anchors[2] = MakeAnchor( cursor, cursor.p.xyz, X_AXIS );
    anchors[3] = MakeAnchor( cursor, cursor.p.xyz, X_AXIS );
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
        var a = MakeAnchor( cursor, currentPos - dir * segmentLength, dir );
        anchors[0] = a;
      }

      var b = MakeAnchor( cursor, currentPos + dir * segmentLength, dir );
      anchors[ ptr2 ] = b;

      var c = MakeAnchor( cursor, currentPos + dir * 2.0 * segmentLength, dir );
      anchors[ ptr3 ] = c;

      if( dist > segmentLength ){
        var d = MakeAnchor( cursor, currentPos + dir * 3.0 * segmentLength, dir );
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

    if( length > numAnchors ){
      start = curvePtr( currPtr + 3 );
      length = numAnchors;
    }
    
  }

  infos.start  = start;
  infos.length = length;

  // curve.infos = CurveInfos( start, length, 0, 0 );
}
`


const WGSL_ComputeCubicCoeffs = (numAnchors: number) =>
/* wgsl */`

const numAnchors: u32 = ${numAnchors};
override C_workgroup_X = 16;
override C_workgroup_Y = 16;

${WGSL_CurveStructsDecl(numAnchors)}

@group(0) @binding(0) var<storage, read> curves: array<Curve>;
@group(0) @binding(1) var<storage, read_write> cubics: array<CubicData>;

fn computeSegment( a: Anchor, b: Anchor, c: Anchor, d: Anchor ) -> CubicSegment {
  // return catmull-rom cubic coefficients from 4 points
  return CubicSegment(
    b.p,
    0.5*(c.p-a.p),
    a.p - 2.5*b.p + 2.0*c.p - 0.5*d.p,
    0.5*(d.p-a.p) + 1.5*( b.p-c.p )
  );
}

@compute @workgroup_size(C_workgroup_X, C_workgroup_Y)
fn computeCubics(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let anchors = &curves[globalId.y].anchors;
  let cubic = &cubics[globalId.y];
  let segments = &cubic.segments;

  segments[globalId.x] = computeSegment( 
    anchors[ (globalId.x - 1 + numAnchors) % numAnchors ],
    anchors[ globalId.x ],
    anchors[ (globalId.x+1) % numAnchors ],
    anchors[ (globalId.x+2) % numAnchors ],
  );

}

`

const WGSL_DebugAnchors = (numAnchors: number, totalVertices: number) =>
/* wgsl */`

${CameraBindGroupFactory.getWgslDeclaration(0)}
${WGSL_CurveStructsDecl(numAnchors)}

fn curvePtr( index: u32 ) -> u32 {
  return index % ${numAnchors};
}

@group(1) @binding(0) var<storage> curves: array<Curve>;
@group(1) @binding(1) var<storage> cubics: array<CubicData>;


@vertex
fn vertexAnchors( 
  @builtin(vertex_index) anchorIndex: u32,
  @builtin(instance_index) curveIndex: u32 
) -> @builtin(position) vec4f {
  let infos = curves[curveIndex].infos;
  var i = curvePtr( min( anchorIndex, infos.length - 1 ) + infos.start );
  var pos = curves[curveIndex].anchors[i].p.xyz;
  // pos += vec3<f32>(f32(anchorIndex)*0.01, f32(curveIndex)*0.01, 0.0);
  
  return camera.viewProj * vec4f( pos, 1.0 );
}

fn resolveCurveSegment( curveIndex: u32, vertexZ: f32, t : ptr<function,f32> ) -> CubicSegment {
  let infos = curves[curveIndex].infos;
  var p = vertexZ * f32(infos.length) - 3.00001;
  
  var segIndex = u32( floor( p ) );
  segIndex = segIndex + infos.start + 1;
  segIndex = segIndex % ${numAnchors};

  *t = fract( p );
  return cubics[curveIndex].segments[ segIndex ];
}


@vertex
fn vertexCurve( 
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) curveIndex: u32 
) -> @builtin(position) vec4f {
  
  let infos = curves[curveIndex].infos;
  var p = f32(vertexIndex) / f32(${totalVertices});
  var t:f32 = 0;
  var segment = resolveCurveSegment( curveIndex, p, &t );
  var cp = segment.a + t * ( segment.b + t * ( segment.c + t * segment.d ) );

  // cp = curves[curveIndex].anchors[segIndex].p;
  return camera.viewProj * vec4f( cp.xyz, 1.0 );
}

struct RibbonVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) side: f32,
  @location(1) p: f32,
};

@vertex
fn vertexRibbon( 
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) curveIndex: u32 
) -> RibbonVertexOutput {
  let infos = curves[curveIndex].infos;
  var vSide = vertexIndex % 2;
  var pIndex = (vertexIndex-vSide) / 2;

  var rawp = f32(pIndex) / f32(${totalVertices/2.0});
  // p *= ${numAnchors-3.00001};
  var p = rawp * f32(infos.length) - 3.00001;
  
  var segIndex = u32( floor( p ) );
  segIndex = segIndex + infos.start + 1;
  segIndex = segIndex % ${numAnchors};

  var segment = cubics[curveIndex].segments[ segIndex ];
  var t = fract( p );

  var cp = ( segment.a + t * ( segment.b + t * ( segment.c + t * segment.d ) ) ).xyz;
  var ct = ( normalize( segment.b + t * ( 2.0 * segment.c + t * 3.0 * segment.d ) ) ).xyz;

  var viewDir = camera.worldPos - cp;
  var binorm = normalize( cross( ct, viewDir ) );

  var thickness = 0.01;
  var side = f32(vSide) * 2.0 - 1.0;
  cp += side*binorm * thickness;
   
  // cp = curves[curveIndex].anchors[segIndex].p;
  return RibbonVertexOutput(
    camera.viewProj * vec4f(cp, 1.0),
    side, rawp
  );

}

@fragment
fn fragmentAnchors() -> @location(0) vec4f {
  return vec4f(0.0, 1.0, 0.0, 1.0);
}

@fragment
fn fragmentCurve() -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}

@fragment
@blend( one, one )
fn fragmentRibbon( varyings: RibbonVertexOutput) -> @location(0) vec4f {
  var s = varyings.side;
  var p = varyings.p;
  var lum = (1.0 - abs(s))*.3 * p;
  return vec4f(lum, lum, lum, 1.0);
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

const UP = vec3f(0.0, 1.0, 0.0);

@compute @workgroup_size(C_workgroup_X, C_workgroup_Y)
fn animateCurves(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let anchors = &curves[globalId.y].anchors;
  let anchor = anchors[globalId.x];
  var pos = anchor.p.xyz;
  // var tan = anchor.t;
  // var nrm = normalize(cross(tan, UP));
  // var binorm = cross(tan, nrm);

  // var angle = 13.0 * snoise3D( pos * 0.2 ) + f32(globalId.y);
  // var dir = nrm * cos(angle) + binorm * sin(angle);
  // pos += dir * 0.001;
  pos += curlNoise( pos * 2.0 ) * 0.001;

  anchors[globalId.x].p = vec4f( pos, anchor.p.w );
}
`

export default class GpuCurves implements IRenderable {

  static readonly ANCHOR_BYTE_SIZE = ANCHOR_BYTE_SIZE

  private cursorsBuffer: GPUBuffer
  private anchorsBuffer: GPUBuffer
  private cubicCoeffBuffer: GPUBuffer

  private cursorsData: Float32Array;

  readonly numSegments: number
  private updateCurvesSource : WgslSource
  private animateCurvesSource: WgslSource
  private computeCoeffsSource: WgslSource
  private debugAnchorsSource : WgslSource

  private updateCurveBindGroup  : GPUBindGroup
  private animateCurveBindGroup : GPUBindGroup
  private computeCoeffsBindGroup: GPUBindGroup
  private debugAnchorsBindGroup : GPUBindGroup

  private updateCurvesPipeline !: GPUComputePipeline
  private animateCurvesPipeline!: GPUComputePipeline
  private computeCoeffsPipeline!: GPUComputePipeline
  private debugAnchorsPipeline !: GPURenderPipeline
  private debugCurvePipeline   !: GPURenderPipeline
  private ribbonPipeline       !: GPURenderPipeline

  private coeffDispatch: [number, number];


  constructor(private device: GPUDevice, readonly numCurves = 64, readonly numAnchors = 128, readonly segmentLength = 0.1) {
    
    if( !isPOT(numAnchors) ) throw new Error('numAnchors must be a power of two')
    if( !isPOT(numCurves) ) throw new Error('numCurves must be a power of two')

    this.numSegments = numAnchors - 3;

    this.cursorsData = new Float32Array(numCurves * ANCHOR_BYTE_SIZE / 4)

    this.cursorsBuffer = device.createBuffer({
      label: "GpuCurves Cursors Buffer",
      size: numCurves * ANCHOR_BYTE_SIZE, // vec4f
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })

    this.anchorsBuffer = device.createBuffer({
      label: "GpuCurves Anchors Buffer",
      size: numCurves * ( ( numAnchors+3) * ANCHOR_BYTE_SIZE + CURVE_META_BYTE_SIZE), // vec4f
      usage: GPUBufferUsage.STORAGE
    })

    this.cubicCoeffBuffer = device.createBuffer({
      label: "GpuCurves Cubic Coeff Buffer",
      size: numCurves * (numAnchors * 4 * 4 * 4), // vec4f
      usage: GPUBufferUsage.STORAGE
    })



    this.updateCurvesSource  = new WgslSource(device, WGSL_UpdateCurves       (numAnchors, numCurves     ), 'GpuCurves UpdateCurves'      )
    this.animateCurvesSource = new WgslSource(device, WGSL_AnimateCurve       (numAnchors                ), 'GpuCurves AnimateCurves'     )
    this.computeCoeffsSource = new WgslSource(device, WGSL_ComputeCubicCoeffs (numAnchors                ), 'GpuCurves ComputeCubicCoeff' )
    this.debugAnchorsSource  = new WgslSource(device, WGSL_DebugAnchors       (numAnchors, numAnchors*10 ), 'GpuCurves DebugAnchors'      )


    this.updateCurveBindGroup = this.updateCurvesSource.createBindGroup( 0, [
      { binding: 0, resource: { buffer: this.cursorsBuffer } },
      { binding: 1, resource: { buffer: this.anchorsBuffer } },
    ])
 
    this.animateCurveBindGroup = this.animateCurvesSource.createBindGroup( 0, [
      { binding: 0, resource: { buffer: this.anchorsBuffer } },
    ])

    this.computeCoeffsBindGroup = this.computeCoeffsSource.createBindGroup( 0, [
      { binding: 0, resource: { buffer: this.anchorsBuffer } },
      { binding: 1, resource: { buffer: this.cubicCoeffBuffer } },
    ])

    this.debugAnchorsBindGroup = this.debugAnchorsSource.createBindGroup( 1, [
      { binding: 0, resource: { buffer: this.anchorsBuffer } },
      { binding: 1, resource: { buffer: this.cubicCoeffBuffer } },
    ])

    const maxInvokation = device.limits.maxComputeInvocationsPerWorkgroup
    const C_workgroup_X = Math.min( maxInvokation, numAnchors );
    const C_workgroup_Y = Math.min( maxInvokation / C_workgroup_X, numCurves );

    this.coeffDispatch = [
      Math.ceil( numAnchors / C_workgroup_X ),
      Math.ceil( numCurves / C_workgroup_Y )
    ]

    console.log( 'numAnchors', numAnchors, 'numCurves', numCurves, 'maxInvokation', maxInvokation)
    console.log('C_workgroup_X', C_workgroup_X, 'C_workgroup_Y', C_workgroup_Y, 'disp X', this.coeffDispatch[0], 'disp Y', this.coeffDispatch[1] )

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

      this.animateCurvesSource.createComputePipelineAsync('animateCurves', {
        constants: {
          C_workgroup_X,
          C_workgroup_Y,
        }
      }).then(pipeline => {
        this.animateCurvesPipeline = pipeline
      }),

      this.computeCoeffsSource.createComputePipelineAsync('computeCubics', {
        constants: {
          C_workgroup_X,
          C_workgroup_Y,
        }
      }).then(pipeline => {
        this.computeCoeffsPipeline = pipeline
      }),

      this.debugAnchorsSource.createRenderPipelineAsync({
        primitive: {
          topology: 'line-strip'
        },
      }, 'vertexAnchors', 'fragmentAnchors' ).then(pipeline => {
        this.debugAnchorsPipeline = pipeline
      }),

      this.debugAnchorsSource.createRenderPipelineAsync({
        primitive: {
          topology: 'line-strip'
        },
      }, 'vertexCurve', 'fragmentCurve' ).then(pipeline => {
        this.debugCurvePipeline = pipeline
      }),

      this.debugAnchorsSource.createRenderPipelineAsync({
        primitive: {
          topology: 'triangle-strip'
        },

      }, 'vertexRibbon', 'fragmentRibbon' ).then(pipeline => {
        this.ribbonPipeline = pipeline
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

      pass.setPipeline(this.animateCurvesPipeline)
      pass.setBindGroup(0, this.animateCurveBindGroup)
      pass.dispatchWorkgroups(this.coeffDispatch[0], this.coeffDispatch[1])

      pass.setPipeline(this.computeCoeffsPipeline)
      pass.setBindGroup(0, this.computeCoeffsBindGroup)
      pass.dispatchWorkgroups(this.coeffDispatch[0], this.coeffDispatch[1])
      pass.end()
      
      this.device.queue.writeBuffer(this.cursorsBuffer, 0, this.cursorsData)
      this.device.queue.submit([encoder.finish()])

    })

    renderer.defaultPass.addCommands( (ctx)=>{
       
      const encoder = ctx.encoder;
      encoder.setBindGroup(0, ctx.cameraBindGroup.getBindGroup());
      encoder.setBindGroup(1, this.debugAnchorsBindGroup );

      // encoder.setPipeline(this.debugAnchorsPipeline);
      // encoder.draw( this.numAnchors, this.numCurves, 0, 0 );

      // encoder.setPipeline(this.debugCurvePipeline);
      // encoder.draw( this.numAnchors * 10, this.numCurves, 0, 0 );

      encoder.setPipeline(this.ribbonPipeline);
      encoder.draw( this.numAnchors * 10, this.numCurves, 0, 0 );
    })
  }


}