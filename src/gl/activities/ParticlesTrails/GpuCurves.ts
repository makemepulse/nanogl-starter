import type { AnyPromise } from "../../../utils/AnyPromise";
import { CameraBindGroupFactory } from "../../core/BindGroup";
import WgslSource from "../../core/WgslSource";
import { isPOT } from "../../math";
import type { IRenderable } from "../../renderer/Renderable";
import type Renderer from "../../renderer/Renderer";
import { TextureSrcSet } from "../../resources/TextureRequest";
import TextureResource from "../../resources/TextureResource";
import { CurlNoise } from "../../wgsl/CurlNoise";
import { SimplexNoise } from "../../wgsl/SimplexNoise";

const ANCHOR_BYTE_SIZE = 4 * 8; // vec4f + vec3f + f32
const CURVE_META_BYTE_SIZE = 4 * 4; // vec4u


export const WGSL_CurveStructsDecl = (numAnchors: number) =>

/* wgsl */`

struct Anchor {
  p: vec4f,
  t: vec3f,
  absV: f32,
}

struct CubicSegment {
  a: vec4f,
  b: vec4f,
  c: vec4f,
  d: vec4f,

  absV: vec4f
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

fn MakeAnchor( cursor: Anchor, p: vec3f, t: vec3f, absV: f32 ) -> Anchor {
  // return Anchor( vec4<f32>( p, cursor.p.w ), t, 0.0);
  return Anchor( vec4<f32>( p, cursor.p.w ), t, absV);
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
    anchors[0] = MakeAnchor( cursor, cursor.p.xyz, X_AXIS, 0.0 );
    anchors[1] = MakeAnchor( cursor, cursor.p.xyz, X_AXIS, 1.0 );
    anchors[2] = MakeAnchor( cursor, cursor.p.xyz, X_AXIS, 2.0 );
    anchors[3] = MakeAnchor( cursor, cursor.p.xyz, X_AXIS, 3.0 );
  } 
  else {

    var currPtr = curvePtr(start + length - 3);

    var currentPos = anchors[ currPtr ].p.xyz;
    var currentAbsV = anchors[ currPtr ].absV;
    var dist = distance( cursor.p.xyz, currentPos );
    

    loop {
      var ptr2 = curvePtr(currPtr + 1);
      var ptr3 = curvePtr(currPtr + 2);

      var dir = normalize( cursor.p.xyz - currentPos );

      if( length == 4 ){
        var a = MakeAnchor( cursor, currentPos - dir * segmentLength, dir, 0.0 );
        anchors[0] = a;
      }

      var b = MakeAnchor( cursor, currentPos + dir * segmentLength, dir, currentAbsV + 1.0 );
      anchors[ ptr2 ] = b;

      var c = MakeAnchor( cursor, currentPos + dir * 2.0 * segmentLength, dir, currentAbsV + 2.0 );
      anchors[ ptr3 ] = c;

      if( dist > segmentLength ){
        var d = MakeAnchor( cursor, currentPos + dir * 3.0 * segmentLength, dir, currentAbsV + 3.0);
        anchors[ curvePtr(currPtr + 3) ] = d;
        currPtr = ptr2;
        currentPos = b.p.xyz;
        currentAbsV = b.absV;
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
    0.5*(d.p-a.p) + 1.5*( b.p-c.p ),

    vec4f( b.absV, c.absV, 0.0, 0.0 )
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
@group(1) @binding(2) var tDiffuse: texture_2d<f32>;
@group(1) @binding(3) var tSampler: sampler;
@group(1) @binding(4) var<uniform> uTime: f32;


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
  @location(2) ci: f32,
  @location(3) absV: f32,
  @location(4) ct: f32, // creation time
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

  var cp = ( segment.a + t * ( segment.b + t * ( segment.c + t * segment.d ) ) );
  var ct = ( normalize( segment.b + t * ( 2.0 * segment.c + t * 3.0 * segment.d ) ) ).xyz;

  var viewDir = camera.worldPos - cp.xyz;
  var binorm = normalize( cross( ct, viewDir ) );

  var thickness = 0.05;
  var side = f32(vSide) * 2.0 - 1.0;
  var finalP = cp.xyz + side*binorm * thickness;

  var absV = segment.absV.x * (1.0-t) + segment.absV.y * t;
   
  // cp = curves[curveIndex].anchors[segIndex].p;
  return RibbonVertexOutput(
    camera.viewProj * vec4f(finalP, 1.0),
    side, rawp, f32(curveIndex), absV, cp.w
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
@blend( src_alpha, one )
fn fragmentRibbon( varyings: RibbonVertexOutput) -> @location(0) vec4f {
  var s = varyings.side;
  var p = varyings.p;
  var ci = varyings.ci;
  var absV = varyings.absV;
  // return vec4f(lum, lum, lum, 1.0);
  
  var life = uTime - varyings.ct;
  var lifeFade = 1.0 - smoothstep(0.0, 0.01, life);
  
  var lum = pow( p, 0.5) * lifeFade;

  var uvs: vec2f = vec2f(absV*0.1 + ci*.234, s*0.5+0.5);

  return textureSample(tDiffuse, tSampler, uvs) - 1.0 + lum;
}

`

export interface CurveBehaviour {

  updateCursors( encoder: GPUComputePassEncoder ): void;

  animateCurve( encoder: GPUComputePassEncoder ): void;

}

export default class GpuCurves implements IRenderable {

  static readonly ANCHOR_BYTE_SIZE = ANCHOR_BYTE_SIZE

  readonly cursorsBuffer: GPUBuffer
  readonly anchorsBuffer: GPUBuffer
  readonly cubicCoeffBuffer: GPUBuffer
  readonly renderUniformBuffer: GPUBuffer

  readonly numSegments: number
  private updateCurvesSource : WgslSource
  private computeCoeffsSource: WgslSource
  private debugAnchorsSource : WgslSource

  private updateCurveBindGroup  : GPUBindGroup
  private computeCoeffsBindGroup: GPUBindGroup
  private debugAnchorsBindGroup! : GPUBindGroup

  private updateCurvesPipeline !: GPUComputePipeline
  private animateCurvesPipeline!: GPUComputePipeline
  private computeCoeffsPipeline!: GPUComputePipeline
  private debugAnchorsPipeline !: GPURenderPipeline
  private debugCurvePipeline   !: GPURenderPipeline
  private ribbonPipeline       !: GPURenderPipeline
  private trailDiffuseTex: TextureResource;

  readonly perAnchorsDispatch: [dispatchX:number, dispatchY:number, wgSize_X: number, wgSize_Y: number];

  private _curveBehaviour: CurveBehaviour | null = null;


  constructor(private device: GPUDevice, readonly numCurves = 64, readonly numAnchors = 128, readonly segmentLength = 0.1) {
    
    if( !isPOT(numAnchors) ) throw new Error('numAnchors must be a power of two')
    if( !isPOT(numCurves) ) throw new Error('numCurves must be a power of two')

    this.numSegments = numAnchors - 3;

    this.cursorsBuffer = device.createBuffer({
      label: "GpuCurves Cursors Buffer",
      size: numCurves * ANCHOR_BYTE_SIZE, // vec4f
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })

    this.anchorsBuffer = device.createBuffer({
      label: "GpuCurves Anchors Buffer",
      size: numCurves * ( ( numAnchors+3) * ANCHOR_BYTE_SIZE + CURVE_META_BYTE_SIZE), // vec4f
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })

    this.cubicCoeffBuffer = device.createBuffer({
      label: "GpuCurves Cubic Coeff Buffer",
      size: numCurves * (numAnchors * 4 * 4 * 5), // vec4f
      usage: GPUBufferUsage.STORAGE
    })



    this.updateCurvesSource  = new WgslSource(device, WGSL_UpdateCurves       (numAnchors, numCurves     ), 'GpuCurves UpdateCurves'      )
    this.computeCoeffsSource = new WgslSource(device, WGSL_ComputeCubicCoeffs (numAnchors                ), 'GpuCurves ComputeCubicCoeff' )
    this.debugAnchorsSource  = new WgslSource(device, WGSL_DebugAnchors       (numAnchors, numAnchors*10 ), 'GpuCurves DebugAnchors'      )


    this.updateCurveBindGroup = this.updateCurvesSource.createBindGroup( 0, [
      { binding: 0, resource: { buffer: this.cursorsBuffer } },
      { binding: 1, resource: { buffer: this.anchorsBuffer } },
    ])
 


    this.computeCoeffsBindGroup = this.computeCoeffsSource.createBindGroup( 0, [
      { binding: 0, resource: { buffer: this.anchorsBuffer } },
      { binding: 1, resource: { buffer: this.cubicCoeffBuffer } },
    ])


    const sampler = device.createSampler({addressModeU: 'repeat', addressModeV: 'repeat'});

    this.trailDiffuseTex = new TextureResource( new TextureSrcSet([
      ['webp', 'assets/trail_diffuse.webp'],
      ['std', 'assets/trail_diffuse.png']
    ] ), device )

  

    const maxInvokation = device.limits.maxComputeInvocationsPerWorkgroup
    const C_workgroup_X = Math.min( maxInvokation, numAnchors );
    const C_workgroup_Y = Math.min( maxInvokation / C_workgroup_X, numCurves );

    this.perAnchorsDispatch = [
      Math.ceil( numAnchors / C_workgroup_X ),
      Math.ceil( numCurves / C_workgroup_Y ),
      C_workgroup_X,
      C_workgroup_Y
    ]

    console.log( 'numAnchors', numAnchors, 'numCurves', numCurves, 'maxInvokation', maxInvokation)
    console.log('C_workgroup_X', C_workgroup_X, 'C_workgroup_Y', C_workgroup_Y, 'disp X', this.perAnchorsDispatch[0], 'disp Y', this.perAnchorsDispatch[1] )




    this.ready = Promise.all([
      
      this.trailDiffuseTex.load(),

      this.updateCurvesSource.createComputePipelineAsync('updateCurves', {
        constants: {
          numCurves,
          segmentLength,
          numAnchors,
        }
      }).then(pipeline => {
        this.updateCurvesPipeline = pipeline
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

    this.renderUniformBuffer = device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.ready.then( ()=>{
      this.debugAnchorsBindGroup = this.debugAnchorsSource.createBindGroup( 1, [
        { binding: 0, resource: { buffer: this.anchorsBuffer } },
        { binding: 1, resource: { buffer: this.cubicCoeffBuffer } },
        { binding: 2, resource: this.trailDiffuseTex.texture!.createView() },
        { binding: 3, resource: sampler },
        { binding: 4, resource: {buffer: this.renderUniformBuffer } },
      ])
    })

  }

  reset(){
    const anchorsBufferByteSize = this.numCurves * ( ( this.numAnchors+3) * ANCHOR_BYTE_SIZE + CURVE_META_BYTE_SIZE)
    this.device.queue.writeBuffer(this.anchorsBuffer, 0, new Float32Array( anchorsBufferByteSize/4 ).buffer)
  }


  setCurveBehaviour( behaviour: CurveBehaviour ): void {
    this._curveBehaviour = behaviour;
  }

  ready?: AnyPromise | undefined;

  dispose(): void {

  }

  addedToRenderer(renderer: Renderer): void {

    renderer.defaultPass.beforeRender(() => {

      // update rendering uniforms

      const time = performance.now() * 0.00001;
      this.device.queue.writeBuffer(this.renderUniformBuffer, 0, new Float32Array([time]).buffer)

      // update cursors buffer here
      
      const encoder = this.device.createCommandEncoder({ label: 'GpuCurves compute command encoder' })
      const pass = encoder.beginComputePass({ label: 'GpuCurves compute pass' });
      
      // this.device.queue.writeBuffer(this.cursorsBuffer, 0, this.cursorsData)
      this._curveBehaviour?.updateCursors(pass)

      pass.setPipeline(this.updateCurvesPipeline)
      pass.setBindGroup(0, this.updateCurveBindGroup)
      pass.dispatchWorkgroups(1)

      this._curveBehaviour?.animateCurve(pass)

      pass.setPipeline(this.computeCoeffsPipeline)
      pass.setBindGroup(0, this.computeCoeffsBindGroup)
      pass.dispatchWorkgroups(this.perAnchorsDispatch[0], this.perAnchorsDispatch[1])
      pass.end()
      
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