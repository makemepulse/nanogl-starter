import { CameraBindGroupFactory } from "../../core/BindGroup";
import WgslSource, { type PipelineGeometryData } from "../../core/WgslSource";
import type { IRenderable } from "../../renderer/Renderable";
import type Renderer from "../../renderer/Renderer";
import type CatmullCurve from "./CatmullCurve";
import WgslParametricCurve, { CubicCurveSegmentDecl, CurveParamsDecl } from "./WgslParametricCurve";

const WGSL = /* wgsl */`

${CameraBindGroupFactory.getWgslDeclaration(0)}
${CubicCurveSegmentDecl}
${CurveParamsDecl}

@group(1) @binding(0) var<storage, read> segments: array<CubicCurveSegment>;
@group(1) @binding(1) var<uniform> curveParams: CurveParams;

@vertex 
fn vertexMain( @location(0) position: vec3f ) -> @builtin(position) vec4f {
  var p = position.z * f32( curveParams.numAnchors - 3 );
  var segIndex = u32(floor( p ));
  var segment = segments[ segIndex ];
  var t = fract( p );
  var cp = segment.coeffA + t * ( segment.coeffB + t * ( segment.coeffC + t * segment.coeffD ) );
  return camera.viewProj * vec4f(cp.xyz, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {  
  return vec4f(1.0, 0.0, 0.0, 1.0);
}

`

const FLOAT_PER_VERT = 3;

export default class Trail implements IRenderable {
  
  private vertices: Float32Array;
  vBuffer: GPUBuffer;

  ready: Promise<any>;
  source: WgslSource;
  pipeline!: GPURenderPipeline;
  curvePipelineSource: WgslParametricCurve;
  computePipeline!: GPUComputePipeline;
  computeBindGroup: GPUBindGroup;
  renderBindGroup: GPUBindGroup;

  constructor(private device: GPUDevice, private curve :CatmullCurve, private numPoints = 1024) {
    
    
    this.vBuffer = device.createBuffer({
      label: "Trail Vertex Buffer",
      size: numPoints * FLOAT_PER_VERT*4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    this.vertices = new Float32Array(this.vBuffer.getMappedRange());
    
    for (let i = 0; i < numPoints; i++) {
      const j = i * FLOAT_PER_VERT;
      this.vertices[j + 0] = 0;
      this.vertices[j + 1] = 0;
      this.vertices[j + 2] = i/(numPoints-1);
    }
    this.vBuffer.unmap();

    this.source = new WgslSource(device, WGSL, 'Trail');

    const geom: PipelineGeometryData = {
      primitive: {
        topology: 'line-strip',
      },
      buffers: [
        {
          arrayStride: FLOAT_PER_VERT * 4,
          attributes: [{
            format: 'float32x3',
            offset: 0,
            shaderLocation: 0,
          }],
        }
      ]
    }

    const numSegs = this.curve.maxAnchors-3;
    
    const segmentsBuffer = device.createBuffer({
      label: "Trail Segments Buffer",
      size: numSegs * WgslParametricCurve.BYTES_PER_SEGMENT,
      usage: GPUBufferUsage.STORAGE,
    });

    
    this.curvePipelineSource = new WgslParametricCurve( device )
    this.computeBindGroup = this.curvePipelineSource.createBindGroup( curve, segmentsBuffer )
    
    this.ready = Promise.all([
      this.source.createRenderPipelineAsync(geom).then( pipeline => {
        this.pipeline = pipeline;
      }),
      this.curvePipelineSource.createComputeSegmentPipelineAsync( numSegs ).then( pipeline => {
        this.computePipeline = pipeline;
      })
    ])

    this.renderBindGroup = device.createBindGroup({
      layout: this.source.getBindGroupLayouts()[1],
      entries: [
        { binding: 0, resource: { buffer: segmentsBuffer } },
        { binding: 1, resource: { buffer: this.curve.parambuffer } },
      ]
    });


  }

  
  dispose(): void {
    throw new Error("Method not implemented.");
  }


  addedToRenderer(renderer: Renderer): void {
    
    renderer.defaultPass.beforeRender( ()=>{

      this.curve.updateBufferIfNeeded()

      const encoder = this.device.createCommandEncoder({label:'compute command encoder'})

      const pass = encoder.beginComputePass({label: 'compute pass'});
      pass.setPipeline(this.computePipeline)
      pass.setBindGroup(0, this.computeBindGroup)
      pass.dispatchWorkgroups( 1 )
      pass.end()
      this.device.queue.submit([encoder.finish()])
    })

    renderer.defaultPass.addCommands( (ctx)=>{
       
      const encoder = ctx.encoder;
      encoder.setPipeline(this.pipeline);
      encoder.setVertexBuffer(0, this.vBuffer);
      encoder.setBindGroup(0, ctx.cameraBindGroup.getBindGroup());
      encoder.setBindGroup(1, this.renderBindGroup);
      encoder.draw( this.numPoints );
    })
  }

}