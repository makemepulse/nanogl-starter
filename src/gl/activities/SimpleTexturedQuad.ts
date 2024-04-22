import type Engine from "../Engine";
import { TextureSrcSet } from "../resources/TextureRequest";
import TextureResource from "../resources/TextureResource";
import Quad from "../utils/Quad";
import TexturedQuad from "../wgsl/TexturedQuad";
import type { RenderContext } from "../core/RenderContext";


export default class SimpleTexturedQuad {

  
  texRes1: TextureResource;
  pipeline: GPURenderPipeline;
  quad: Quad;
  bindGroup?: GPUBindGroup;
  shader: TexturedQuad;
  
  constructor( readonly engine: Engine ) {
    
    const device = this.engine.device;    
    
    
    this.texRes1 = new TextureResource( new TextureSrcSet([
      ['webp', 'assets/sample_tex_alpha.webp'],
      ['std', 'assets/sample_tex_alpha.webp'],
    ] ), device )
    
  
    this.quad = new Quad( device )  
  
    this.shader = new TexturedQuad( device );
  
    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 16,
      attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0,
      }, 
      {
        format: "float32x2",
        offset: 8,
        shaderLocation: 1,
      }],
    };

  
    this.pipeline = device.createRenderPipeline({
      label: 'Simple Quad',
      layout: 'auto',
        
      primitive: {
        topology: 'triangle-strip',
      },
      vertex: {
        module: this.shader.module,
        entryPoint: 'vertexMain',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module : this.shader.module,
        entryPoint: 'fragmentMain',
        targets: [{ format: this.engine.canvasTarget.format! }],
      },
    });   
    
    
  }

  init(): void {
    
    const device = this.engine.device; 

    const sampler = device.createSampler();

    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: {buffer: this.shader.uniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: this.texRes1.value!.createView() },
      ],
    });
  }
  
  render( context: RenderContext ): void {

    this.shader.setUniforms( context.camera._viewProj );

    // Draw the square.
    context.renderPassEncoder.setPipeline(this.pipeline);
    context.renderPassEncoder.setBindGroup(0, this.bindGroup!);
    context.renderPassEncoder.setVertexBuffer(0, this.quad.vertexBuffer );
    context.renderPassEncoder.draw(4);

  }

}