import { mat4 } from 'gl-matrix';
import { CameraBindGroupFactory } from '../../core/BindGroup';
import type { RenderContext } from '../../renderer/RenderContext';

/**
 * Cross Vertex Buffer data
 */
const BUFF = new ArrayBuffer(6 * 4 * 4)

/**
 * vertices positions
 */
const FBUFF = new Float32Array(BUFF)
FBUFF[4] = 1.0
FBUFF[13] = 1.0
FBUFF[22] = 1.0

/**
 * vertices colors
 */
const IBUFF = new Uint32Array(BUFF);
IBUFF[3] = IBUFF[7] = 0x000000FF
IBUFF[11] = IBUFF[15] = 0x0000FF00
IBUFF[19] = IBUFF[23] = 0x00FF0000





const WGSL = /* wgsl */`

${CameraBindGroupFactory.getWgslDeclaration(1)}

struct InstanceState {
  matrix: mat4x4<f32>,
}

struct Vertex {
  @location(0) position: vec3f,
  @location(1) color: vec4f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@group(0) @binding(0) var<storage> instStates: array<InstanceState>;

@vertex
fn vertexMain( 
  vertex: Vertex,
  @builtin(instance_index) instance: u32
) -> VertexOutput {

  var inst = instStates[instance];
  var worldPos = camera.viewProj * (inst.matrix * vec4f(vertex.position, 1.0));

  var vsOut: VertexOutput;
  vsOut.position = worldPos;
  vsOut.color = vertex.color;
  return vsOut; 
}


@fragment
fn fragmentMain( input: VertexOutput ) -> @location(0) vec4f {  
  return input.color;
}
`


const FLOAT_PER_INST = 16;
const BYTES_PER_INST = FLOAT_PER_INST * 4;

const maxInstances = 1024;
const Label = 'AxisGuizmo';


export default class AxisRenderer {


  private pipeline         : GPURenderPipeline;
  private bindGroup        : GPUBindGroup     ;
  private instStatesStorage: GPUBuffer        ;
  private vertexBuffer     : GPUBuffer        ;

  private instanceBufferData : Float32Array;

  private numInstances = 0

  constructor(private device:GPUDevice ) {

    this.instanceBufferData = new Float32Array( maxInstances * FLOAT_PER_INST );


    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 16,
      attributes: [{
        // position
        shaderLocation: 0,
        offset: 0,
        format: "float32x3",
      },{
        // color
        shaderLocation: 1,
        offset: 12,
        format: "unorm8x4",
      }],
    };

    const shader = device.createShaderModule({
      label: Label,
      code: WGSL,
    });

    this.pipeline = device.createRenderPipeline({
      label: Label,
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
      
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
        topology: 'line-list',
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
      label: `${Label} instances`,
      size: maxInstances * BYTES_PER_INST,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });


    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: {buffer: this.instStatesStorage } },
      ],
    });
    

    this.vertexBuffer = device.createBuffer({
      label: Label,
      size: BUFF.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, BUFF);

  }


  add( matrix: mat4 ): void {
    if( this.numInstances >= maxInstances ) {
      throw new Error('Too many instances');
    }

    const offset = this.numInstances * FLOAT_PER_INST;
    this.instanceBufferData.set( matrix, offset );
    this.numInstances++;
  }


  clear(): void {
    this.numInstances = 0;
  }

  render(context: RenderContext ): void {

    if( this.numInstances===0 ) return

    this.device.queue.writeBuffer(this.instStatesStorage, 0, this.instanceBufferData, 0, this.numInstances * FLOAT_PER_INST);
    
    const pass = context.renderPassEncoder;
    
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup ); // Updated!
    pass.setBindGroup(1, context.cameraBindGroup.getBindGroup() ); // Updated!
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw( 6, this.numInstances);


  }


}