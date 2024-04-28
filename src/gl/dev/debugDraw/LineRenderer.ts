
import { vec3 } from 'gl-matrix';
import type { RenderActionContext } from '../../renderer/RenderActions';
import type { IRenderable } from '../../renderer/Renderable';
import type Renderer from '../../renderer/Renderer';
import type { RenderViewContext } from '../../renderer/RenderViewContext';


const LABEL = 'Lines';
const MAX_LINES = 2048
const FLOAT_PER_VERT = 4



const WGSL = /* wgsl */`

struct Vertex {
  @location(0) position: vec3f,
  @location(1) color: vec4f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@group(0) @binding(0) var<uniform> viewProjectionMatrix: mat4x4<f32>;

@vertex
fn vertexMain( vertex: Vertex ) -> VertexOutput {
  return VertexOutput(
    viewProjectionMatrix * vec4f(vertex.position, 1.0),
    vertex.color
  );
}

@fragment
fn fragmentMain( input: VertexOutput ) -> @location(0) vec4f {  
  return input.color.bgra;
}

`

//rabg

export default class LineRenderer implements IRenderable {


  /**
   * current number of lines to draw in buffer
   */
  numInstances = 0
  private vertices           : Float32Array
  private colors             : Uint32Array
  private shader             : GPUShaderModule
  private pipeline           : GPURenderPipeline
  private vertexBuffer       : GPUBuffer
  private uniformsBuffer     : GPUBuffer
  private indirectDrawBuffer : GPUBuffer
  private indirectDrawData   : Uint32Array
  private bindGroup          : GPUBindGroup

  constructor(private device: GPUDevice ) {

    this.vertices = new Float32Array(MAX_LINES*2*FLOAT_PER_VERT)
    this.colors = new Uint32Array( this.vertices.buffer )

    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 16,
      attributes: [
        { shaderLocation: 0, offset: 0, format: "float32x3" },
        { shaderLocation: 1, offset: 12, format: "unorm8x4" }
      ],
    };

    this.shader = device.createShaderModule({
      code: WGSL,
      label: LABEL,
    })

    this.pipeline = device.createRenderPipeline({
      label: LABEL,
      layout: 'auto',
      primitive: {
        topology: 'line-list',
      },
      vertex: {
        module: this.shader,
        entryPoint: 'vertexMain',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: this.shader,
        entryPoint: 'fragmentMain',
        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
      
    })

    this.vertexBuffer = device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    this.uniformsBuffer = device.createBuffer({
      label: `${LABEL} uniforms`,
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformsBuffer } },
      ],
    });


    this.indirectDrawBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST
    });
    this.indirectDrawData = new Uint32Array([0, 1, 0, 0]);

  }

  dispose(): void {
    
  }
  
  addedToRenderer(renderer: Renderer): void {

    renderer.defaultPass.addBundle( (context) => {
      this.encode( context );
    }, () => this.numInstances>0 )

    // renderer.defaultPass.addCommands( (context) => {
    //   this.render( context );
    // })

    
    renderer.defaultPass.beforeSubmit( (context ) => {
      this.updateBuffers(context)
      this.clear();
    } )

  }

  clear(){
    this.numInstances = 0
  }

  addLine( a:vec3, b:vec3, hexColor:number ):void {
    const c = this.numInstances*FLOAT_PER_VERT*2
    this.vertices.set( a, c )
    this.vertices.set( b, c+4 )
    this.colors[c+3] = hexColor
    this.colors[c+7] = hexColor
    this.numInstances++;
  }

  updateBuffers(context: RenderViewContext){
    if( this.numInstances === 0 ) return
    this.indirectDrawData[0] = this.numInstances*2;
    this.device.queue.writeBuffer(this.indirectDrawBuffer, 0, this.indirectDrawData);
    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices, 0, this.numInstances*FLOAT_PER_VERT*2)
    this.device.queue.writeBuffer(this.uniformsBuffer, 0, context.camera._viewProj );
  }

  encode(context: RenderActionContext ): void {
    const pass = context.encoder;
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.drawIndirect( this.indirectDrawBuffer, 0 );
  }

  render(context: RenderActionContext ): void {
    if( this.numInstances === 0 ) return
    this.updateBuffers(context)
    this.encode(context)
  }


}