import Node from "nanogl-node";
import { CameraBindGroupFactory } from "../core/BindGroup";
import type RenderPass from "../renderer/RenderPass";
import Renderable from "../renderer/Renderable";
import type Renderer from "../renderer/Renderer";
import { TextureSrcSet } from "../resources/TextureRequest";
import TextureResource from "../resources/TextureResource";
import Quad from "../utils/Quad";
import TexturedQuad from "../wgsl/TexturedQuad";


export default class TexturedQuadRenderable extends Renderable {


  
  texture!: TextureResource;
  pipeline!: GPURenderPipeline;
  quad!: Quad;
  bindGroup?: GPUBindGroup;
  shader!: TexturedQuad;

  node = new Node()


  async allocateResources(renderer: Renderer): Promise<void> {

    const device = renderer.device
    
    this.texture = new TextureResource( new TextureSrcSet([
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

    await this.texture.load();
    this.pipeline = await device.createRenderPipelineAsync({
      label: 'TexturedQuadRenderable',
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

      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "less",
        format: renderer.target.depthStencilFormat,
      },

      

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
          format: renderer.target.getColorAttachmentFormat(0),
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

    const sampler = device.createSampler();

    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [
        { binding: 0, resource: {buffer: this.shader.uniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: this.texture.value!.createView() },
      ],
    });
    
  }
  
  updateResources(): void {
    this.node.updateWorldMatrix()
    this.shader.setUniforms( this.node._wmatrix );
  }


  render(context: RenderPass): void {

    const encoder = context.encoder;
    encoder.setPipeline(this.pipeline);
    encoder.setBindGroup(1, this.bindGroup!);
    encoder.setVertexBuffer(0, this.quad.vertexBuffer );
    encoder.draw(4);
  }

}