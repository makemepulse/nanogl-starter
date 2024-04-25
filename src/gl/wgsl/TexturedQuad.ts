import type { mat4 } from "gl-matrix";
import { CameraBindGroupFactory } from "../core/BindGroup";

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
fn fragmentMain( input: VertexOutput ) -> @location(0) vec4f {  
  return textureSample(pTexture, pSampler, input.texcoord);
}

`



export default class TexturedQuad {

  readonly uniformBuffer: GPUBuffer;
  readonly module: GPUShaderModule;

  static createShaderModule( device: GPUDevice ) : GPUShaderModule {
    const module = device.createShaderModule({
      label: "TexturedQuad",
      code: WGSL,
    });
    return module;
  }

  constructor( readonly device: GPUDevice ) {
    this.module = device.createShaderModule({
      label: "TexturedQuad",
      code: WGSL,
    });

       
    this.uniformBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    
  }

  setUniforms( worldMatrix : mat4 ){
    this.device.queue.writeBuffer(this.uniformBuffer, 0, worldMatrix.buffer, worldMatrix.byteOffset, worldMatrix.byteLength);
  }


}