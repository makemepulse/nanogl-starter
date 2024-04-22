import { mat4, type vec3 } from 'gl-matrix';
import type { RenderContext } from '../../core/RenderContext';


const CircleSegs = 32;

const Circle: number[] = []
for (let i = 0; i < CircleSegs; i++) {
  const a = i / (CircleSegs-1) * Math.PI * 2
  Circle.push( Math.cos(a), Math.sin(a) );
}

const FBUFF = new Float32Array(Circle)



const WGSL = /* wgsl */`

struct InstanceState {
  matrix: mat4x4<f32>,
  radius: f32,
  color: vec3<f32>, 
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@group(0) @binding(1) var<uniform> viewProjectionMatrix: mat4x4<f32>;
@group(0) @binding(0) var<storage> instStates: array<InstanceState>;

@vertex
fn vertexMain( 
  @location(0) position: vec2f,
  @builtin(instance_index) instance: u32
) -> VertexOutput {

  var inst = instStates[instance];
  var worldPos = viewProjectionMatrix * (inst.matrix * vec4f(position*inst.radius, 0.0, 1.0));
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
const CircleGuizmoFloatPerVertex = 16 + 4 + 4;
const CircleGuizmoBytesLength = CircleGuizmoFloatPerVertex * 4;

const maxCircles = 64;


export default class CircleGuizmos {


  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private instStatesStorage: GPUBuffer;
  private uniformsBuffer: GPUBuffer;
  private vertexBuffer: GPUBuffer;
  private bufferData: Float32Array;

  constructor(private device:GPUDevice ) {

    this.bufferData = new Float32Array( maxCircles * CircleGuizmoFloatPerVertex );

    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 8,
      attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0,
      }],
    };

    const module = device.createShaderModule({
      label: "CircleGuizmo",
      code: WGSL,
    });

    this.pipeline = device.createRenderPipeline({
      label: 'Simple Quad',
      layout: 'auto',
        
      primitive: {
        topology: 'line-strip',
      },
      vertex: {
        module,
        entryPoint: 'vertexMain',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module,
        entryPoint: 'fragmentMain',
        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
      },
    }); 

    this.instStatesStorage = device.createBuffer({
      label: "CircleGuizmo Instances",
      size: maxCircles * CircleGuizmoBytesLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.uniformsBuffer = device.createBuffer({
      label: "CircleGuizmo uniforms",
      size: 16*4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: {buffer: this.instStatesStorage } },
        { binding: 1, resource: {buffer: this.uniformsBuffer } },
      ],
    });
    

    this.vertexBuffer = device.createBuffer({
      label: "CircleGuizmo",
      size: FBUFF.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, FBUFF);

  }


  render(context: RenderContext, instances: CircleGuizmo[] ): void {

    if( instances.length > maxCircles ) {
      console.error('Too many circles to render');
      return;
    }

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const offset = i * CircleGuizmoFloatPerVertex;
      this.bufferData.set( inst.matrix, offset );
      this.bufferData[offset+16] = inst.radius;
      this.bufferData.set( inst.color, offset+16+4 );
    }
    this.device.queue.writeBuffer(this.instStatesStorage, 0, this.bufferData, 0, instances.length * CircleGuizmoFloatPerVertex);
    this.device.queue.writeBuffer(this.uniformsBuffer, 0, context.camera._viewProj );
    
    const pass = context.renderPassEncoder;
    
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup ); // Updated!
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw( CircleSegs, instances.length);


  }


}