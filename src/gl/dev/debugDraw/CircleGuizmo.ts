import { mat4, type vec3 } from 'gl-matrix';
import type { RenderContext } from '../../core/RenderContext';
import { CameraBindGroupFactory } from '../../core/BindGroup';


const CircleSegs = 32;

const Circle: number[] = []
for (let i = 0; i < CircleSegs; i++) {
  const a = i / (CircleSegs-1) * Math.PI * 2
  Circle.push( Math.cos(a), Math.sin(a) );
}

const FBUFF = new Float32Array(Circle)



const WGSL = /* wgsl */`

${CameraBindGroupFactory.getWgslDeclaration(1)}

struct InstanceState {
  matrix: mat4x4<f32>,
  radius: f32,
  color: vec3<f32>, 
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@group(0) @binding(0) var<storage> instStates: array<InstanceState>;

@vertex
fn vertexMain( 
  @location(0) position: vec2f,
  @builtin(instance_index) instance: u32
) -> VertexOutput {

  var inst = instStates[instance];
  var worldPos = camera.viewProj * (inst.matrix * vec4f(position*inst.radius, 0.0, 1.0));
  var color = vec4f( inst.color, 1.0 );

  return VertexOutput(
     worldPos,
     color
  );
}


@fragment
fn fragmentMain( input: VertexOutput ) -> @location(0) vec4f {  
  return input.color;
}
`



export type CircleGuizmo = {
  matrix: mat4
  radius: number
  color: vec3
}
const FLOAT_PER_VERTEX = 16 + 4 + 4;
const BYTES_PER_VERTEX = FLOAT_PER_VERTEX * 4;

const maxInstances = 64;


export default class CircleGuizmos {


  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private instStatesStorage: GPUBuffer;
  private vertexBuffer: GPUBuffer;

  private instanceBufferData : Float32Array;

  private numInstances = 0

  constructor(private device:GPUDevice ) {

    this.instanceBufferData = new Float32Array( maxInstances * FLOAT_PER_VERTEX );

    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 8,
      attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0,
      }],
    };

    const shader = device.createShaderModule({
      label: "CircleGuizmo",
      code: WGSL,
    });

    this.pipeline = device.createRenderPipeline({
      label: 'Simple Quad',

      layout: device.createPipelineLayout({
        bindGroupLayouts: [
          device.createBindGroupLayout({
            entries: [
              { binding: 0, visibility: GPUShaderStage.VERTEX, buffer:{type: 'read-only-storage' }},
            ],
          }),
          CameraBindGroupFactory.getBindGroupLayout(device),
        ],
      }),

      primitive: {
        topology: 'line-strip',
      },
      vertex: {
        module: shader,
        entryPoint: 'vertexMain',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: shader,
        entryPoint: 'fragmentMain',
        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
      },
    }); 

    this.instStatesStorage = device.createBuffer({
      label: "CircleGuizmo Instances",
      size: maxInstances * BYTES_PER_VERTEX,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    
    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: {buffer: this.instStatesStorage } },
      ],
    });
    

    this.vertexBuffer = device.createBuffer({
      label: "CircleGuizmo",
      size: FBUFF.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, FBUFF);

  }
  
  add( matrix: mat4, radius:number, color: vec3 ): void {
    
    if( this.numInstances >= maxInstances ) {
      throw new Error('Too many instances');
    }
    
    const offset = this.numInstances * FLOAT_PER_VERTEX;
    this.instanceBufferData.set( matrix, offset );
    this.instanceBufferData[offset+16] = radius;
    this.instanceBufferData.set( color, offset+16+4 );
    this.numInstances++;
  }


  clear(): void {
    this.numInstances = 0;
  }


  render(context: RenderContext ): void {

    if( this.numInstances === 0 ) return;


    this.device.queue.writeBuffer(this.instStatesStorage, 0, this.instanceBufferData, 0, this.numInstances * FLOAT_PER_VERTEX);
    
    const pass = context.renderPassEncoder;
    
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup ); // Updated!
    pass.setBindGroup(1, context.cameraBindGroup.getBindGroup() ); // Updated!
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw( CircleSegs, this.numInstances);

  }


}