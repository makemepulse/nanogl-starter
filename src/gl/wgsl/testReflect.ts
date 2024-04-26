import { WgslReflect } from "wgsl_reflect";
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

@blend( one, one_minus_src_alpha )
@alphaBlend( one, one_minus_src_alpha )
@writeMask( 0xf )
@depthWrite( on )
@depthCompare( less )
@depthBias( 10 )
@depthBiasSlopeScale( -1.0 )
@depthBiasClamp( 0.0 )
@stencilFront( less, keep, keep, replace )
@stencilBack( less, keep, keep, replace )
@stencilReadMask( 0xFF )
@stencilWriteMask( 0xFF )
@format(_bgra8unorm)
fn fragmentMain( input: VertexOutput ) -> @location(0) @format(_bgra8unorm) vec4f {  
  return textureSample(pTexture, pSampler, input.texcoord);
}

struct MultiOutput {
  @location(0) @format(_bgra8unorm) color1: vec4<f32>,
  @location(1) color2: vec4<f32>,
};

@fragment
fn fragmentMultiTargets( input: VertexOutput ) -> MultiOutput {  
  var output: MultiOutput;

  output.color1 = textureSample(pTexture, pSampler, input.texcoord);
  output.color2 = vec4f(1.0, 0.0, 0.0, 1.0);
  return output;
}

`

export function testReflect(){

  const reflect = new WgslReflect(WGSL)
  console.log( reflect )
  console.log( reflect._functions.get('vertexMain')?.node.attributes )
  console.log( reflect._functions.get('fragmentMain')?.node.attributes )

}