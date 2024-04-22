import type { mat4 } from "gl-matrix";

const WGSL =  /* wgsl */`

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texcoord: vec2f,
};

@group(0) @binding(0) var<uniform> modelViewProjectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var pSampler: sampler;
@group(0) @binding(2) var pTexture: texture_2d<f32>;


@vertex
fn vertexMain(@location(0) position: vec2f, @location(1) texcoord: vec2f) -> VertexOutput {
  return VertexOutput( 
    modelViewProjectionMatrix * vec4f(position, 0, 1),
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

  setUniforms( mvp : mat4 ){
    this.device.queue.writeBuffer(this.uniformBuffer, 0, mvp.buffer, mvp.byteOffset, mvp.byteLength);
  }


}