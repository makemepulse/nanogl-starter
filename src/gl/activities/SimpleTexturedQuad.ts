import type Engine from "../Engine";
import { TextureSrcSet } from "../resources/TextureRequest";
import TextureResource from "../resources/TextureResource";
import Quad from "../geometry/Quad";
import TexturedQuad from "../wgsl/TexturedQuad";
import type { RenderContext } from "../renderer/RenderContext";
import Node from "nanogl-node";
import { CameraBindGroupFactory } from "../core/BindGroup";
import type { RenderActionContext } from "../renderer/RenderActions";


export default class SimpleTexturedQuad extends Node {

  
  texRes1: TextureResource;
  pipeline: GPURenderPipeline;
  quad: Quad;
  bindGroup?: GPUBindGroup;
  shader: TexturedQuad;
  
  constructor( readonly engine: Engine, depthTest: boolean = true) {
    super()
    
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
    // WGSL
    // TS
device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'} },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
  ],
}),

  
    this.pipeline = device.createRenderPipeline({
      label: 'Simple Quad depthtest: '+ depthTest,
      layout: device.createPipelineLayout({
        bindGroupLayouts: [
          CameraBindGroupFactory.getBindGroupLayout(device),
          device.createBindGroupLayout({
            entries: [
              { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'} },
              { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
              { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
            ],
          }),
        ],
      }),

      depthStencil: (depthTest) ? {
        depthWriteEnabled: false,
        depthCompare: "less",
        format: "depth24plus",
      }: undefined,

      

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
        targets: [{ 
          format: this.engine.canvasTarget.format!,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
            },
            alpha: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
            },
          },
        }],

      },
    });   
    
  }

  init(): void {
    
    const device = this.engine.device; 

    const sampler = device.createSampler();

    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [
        { binding: 0, resource: {buffer: this.shader.uniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: this.texRes1.value!.createView() },
      ],
    });
  }
  
  render( context: RenderActionContext ): void {
    this.updateWorldMatrix()
    this.shader.setUniforms( this._wmatrix );

    const encoder = context.encoder;
    // Draw the square.
    encoder.setPipeline(this.pipeline);
    encoder.setBindGroup(0, context.cameraBindGroup.getBindGroup() );
    encoder.setBindGroup(1, this.bindGroup!);
    encoder.setVertexBuffer(0, this.quad.vertexBuffer );
    encoder.draw(4);

  }

}