import Node from "nanogl-node";
import WgslSource from "../core/WgslSource";
import { type IRenderable, type ResourceAllocationContext } from "../renderer/Renderable";
import type Renderer from "../renderer/Renderer";
import { TextureSrcSet } from "../resources/TextureRequest";
import TextureResource from "../resources/TextureResource";
import Quad from "../utils/Quad";
import TexturedQuad from "../wgsl/TexturedQuad";


export default class TexturedQuadRenderable implements IRenderable {



  
  texture!: TextureResource;
  pipeline!: GPURenderPipeline;
  quad!: Quad;
  bindGroup?: GPUBindGroup;
  shader!: TexturedQuad;

  node = new Node()


  async allocateResources( device: GPUDevice, context: ResourceAllocationContext): Promise<void> {

    this.texture = new TextureResource( new TextureSrcSet([
      ['webp', 'assets/Bird_diffuse.webp'],
      ['std', 'assets/sample_tex_alpha.webp'],
    ] ), device )
    
  
    this.quad = new Quad( device )  
  
    this.shader = new TexturedQuad( device );
  


    const shaderSource = new WgslSource( device, TexturedQuad.WGSL, 'TexturedQuad' );

    
    await this.texture.load();
    
    this.pipeline = await shaderSource.createRenderPipelineAsync( {
      primitive: {
        topology: 'triangle-strip',
      },
      buffers: [this.quad.layout],
    })
    
    // this.pipeline = await device.createRenderPipelineAsync({
    //   label: 'TexturedQuadRenderable',
    //   layout: device.createPipelineLayout({
    //     bindGroupLayouts: [
    //       CameraBindGroupFactory.getBindGroupLayout(device),
    //       device.createBindGroupLayout({
    //         entries: [
    //           { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'} },
    //           { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
    //           { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
    //         ],
    //       }),
    //     ],
    //   }),

    //   depthStencil: {
    //     depthWriteEnabled: false,
    //     depthCompare: "less",
    //     format: context.depthStencilFormat,
    //   },

      

    //   primitive: {
    //     topology: 'triangle-strip',
    //   },
    //   vertex: {
    //     module: this.shader.module,
    //     entryPoint: 'vertexMain',
    //     buffers: [this.quad.layout],
    //   },
    //   fragment: {
    //     module : this.shader.module,
    //     entryPoint: 'fragmentMain',
    //     targets: [{ 
    //       format: context.colorFormat,
    //       // blend: {
    //       //   color: {
    //       //     srcFactor: 'src-alpha',
    //       //     dstFactor: 'one-minus-src-alpha',
    //       //   },
    //       //   alpha: {
    //       //     srcFactor: 'src-alpha',
    //       //     dstFactor: 'one-minus-src-alpha',
    //       //   },
    //       // },

    //       writeMask: GPUColorWrite.ALL,

    //     }],

    //   },
    // });   

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

  dispose(): void {
    
  }

  addedToRenderer(renderer: Renderer): void {
    
    renderer.getPass('opaque').addCommands( (encoder) => {
      encoder.setPipeline(this.pipeline);
      encoder.setBindGroup(1, this.bindGroup!);
      encoder.setVertexBuffer(0, this.quad.vertexBuffer );
      encoder.draw(4);
    })
    
    renderer.getPass('opaque').beforeRender( () => {
      this.node.updateWorldMatrix()
      this.shader.setUniforms( this.node._wmatrix );
    })
  }


}