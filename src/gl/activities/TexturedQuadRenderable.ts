import { vec3 } from "gl-matrix";
import Node from "nanogl-node";
import { CameraBindGroupFactory } from "../core/BindGroup";
import Time from "../core/Time";
import WgslSource from "../core/WgslSource";
import Quad from "../geometry/Quad";
import { type IRenderable } from "../renderer/Renderable";
import type Renderer from "../renderer/Renderer";
import { TextureSrcSet } from "../resources/TextureRequest";
import TextureResource from "../resources/TextureResource";
import TexturedQuad from "../wgsl/TexturedQuad";


const WGSL =  /* wgsl */`
${CameraBindGroupFactory.getWgslDeclaration(0)}
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texcoord: vec2f,
};

@group(1) @binding(0) var<uniform> matrix: mat4x4<f32>;
@group(1) @binding(1) var pSampler: sampler;
@group(1) @binding(2) var pTexture: texture_2d<f32>;


@vertex
fn vertexMain(@location(0) position: vec2f, @location(1) texcoord: vec2f) -> VertexOutput {
  return VertexOutput( 
    camera.viewProj * (matrix * vec4f(position, 0, 1)),
    texcoord
  );
}


@fragment
@blend( src_alpha, one_minus_src_alpha )
fn fragmentMain( input: VertexOutput ) -> @location(0) vec4f {  
  return textureSample(pTexture, pSampler, input.texcoord);
}

`


export default class TexturedQuadRenderable implements IRenderable {

  
  texture!: TextureResource;
  pipeline!: GPURenderPipeline;
  quad!: Quad;
  bindGroup?: GPUBindGroup;
  shader!: TexturedQuad;
  uniformBuffer!: GPUBuffer;

  node = new Node()

  ready: Promise<void>

  constructor( device: GPUDevice ) {
    this.ready = this.allocateResources( device )
  }

  async allocateResources( device: GPUDevice): Promise<void> {
    this.texture = new TextureResource( new TextureSrcSet([
      ['webp', 'assets/Bird_diffuse.webp'],
      ['std', 'assets/sample_tex_alpha.webp'],
    ] ), device )
    
  
    this.quad = new Quad( device )  
  
    this.shader = new TexturedQuad( device );
  


    const shaderSource = new WgslSource( device, WGSL, 'TexturedQuad' );

    
    await this.texture.load();
    
    this.pipeline = await shaderSource.createRenderPipelineAsync( Quad.pipelineGeometryData )
    
    this.uniformBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const sampler = device.createSampler();

    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [
        { binding: 0, resource: {buffer: this.uniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: this.texture.value!.createView() },
      ],
    });
    
  }

  dispose(): void {
    
  }

  addedToRenderer(renderer: Renderer): void {
    
    renderer.defaultPass.addCommands( (context) => {
      const encoder = context.encoder;
      encoder.setPipeline(this.pipeline);
      encoder.setBindGroup(1, this.bindGroup!);
      encoder.setVertexBuffer(0, this.quad.vertexBuffer );
      encoder.draw(4);
    })
    
    renderer.defaultPass.beforeRender( (context) => {
  
      this.node.rotateX( Time.dt * 0.5 )
      this.node.rotateZ( Time.dt * 0.3 )
      this.node.updateWorldMatrix()
  
      const wm = this.node._wmatrix
      renderer.device.queue.writeBuffer(this.uniformBuffer, 0, wm.buffer, wm.byteOffset, wm.byteLength);
      this.shader.setUniforms( this.node._wmatrix );


      context.debugDraw?.drawCircle(this.node._wmatrix, 1)
      context.debugDraw?.drawAxis(this.node._wmatrix)
      context.debugDraw?.drawLine( vec3.fromValues(0,0,0), vec3.fromValues(1,1,1) )
      context.debugDraw?.drawCone(this.node._wmatrix, 3, Math.PI/8)

      



    })
  }


}