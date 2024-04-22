
const WSGL =  /* wgsl */`

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texcoord: vec2f,
};

@vertex
fn vertexMain(@location(0) position: vec2f, @location(1) texcoord: vec2f) -> VertexOutput {
  return VertexOutput( 
    vec4f(position, 0, 1),
    texcoord
  );
}

@group(0) @binding(0) var pSampler: sampler;
@group(0) @binding(1) var pTexture: texture_2d<f32>;

@fragment
fn fragmentMain( input: VertexOutput ) -> @location(0) vec4f {  
  return textureSample(pTexture, pSampler, input.texcoord);
}

`



export default class Blit {

  static createShaderModule( device: GPUDevice ) : GPUShaderModule {
    const module = device.createShaderModule({
      label: "Blit",
      code: WSGL,
    });
    return module;
  }

}