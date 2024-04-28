import { mat4, vec3 } from "gl-matrix";
import { CameraBindGroupFactory } from "../../core/BindGroup";
import Quad from "../../geometry/Quad";
import type { RenderActionContext } from "../../renderer/RenderActions";
import ColorUtils from "../../utils/Color";
import type { IRenderable } from "../../renderer/Renderable";
import type Renderer from "../../renderer/Renderer";



const M4 = mat4.create()

const Label = 'Grid';

const WGSL = /* wgsl */`

${CameraBindGroupFactory.getWgslDeclaration(0)}

struct InstanceState {
  matrix: mat4x4<f32>,
}

struct Uniforms {
  color: vec3f,
  scale: f32,
};

struct Vertex {
  @location(0) position: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texCoord: vec2f,
};

@group(1) @binding(0) var<uniform> uniforms: Uniforms;
@group(2) @binding(0) var<uniform> matrix: mat4x4<f32>;

@vertex
fn vertexMain( 
  vertex: Vertex,
) -> VertexOutput {
  var scaledPos = vertex.position * uniforms.scale;
  var worldPos = camera.viewProj * ( matrix* vec4f(scaledPos, 0.0, 1.0) );

  var vsOut: VertexOutput;
  vsOut.position = worldPos;
  vsOut.texCoord = scaledPos;
  return vsOut; 
}


fn PristineGrid(uv: vec2f, lineWidth: f32) -> f32 {
  let uvDDXY = vec4f(dpdx(uv), dpdy(uv));
  let uvDeriv = vec2f(length(uvDDXY.xz), length(uvDDXY.yw));
  let drawWidth: vec2f = clamp(vec2f(lineWidth), uvDeriv, vec2f(0.5));
  let lineAA: vec2f = uvDeriv * 3.0;
  var gridUV: vec2f = 1.0-abs(fract(uv) * 2.0 - 1.0);
  var grid2: vec2f = smoothstep(drawWidth + lineAA, drawWidth - lineAA, gridUV);
  grid2 *= saturate(lineWidth / drawWidth);
  grid2 = mix(grid2, vec2f(lineWidth), saturate(uvDeriv * 2.0 - 1.0));
  return 1.0-mix(grid2.x, 1.0, grid2.y);
}

fn GradBox( uv: vec2f, thickness: f32 ) -> f32
{

	// filter kernel
    var w = max(abs(dpdx(uv)), abs(dpdy(uv))) + 0.0001;

    // float n = N;
    var n = thickness;//.2/(min(length(ddx), length(ddy)));

	// analytic (box) filtering
    var a = uv + 0.5*w;                        
    var b = uv - 0.5*w;           
    var i = (
      floor(a)+min(fract(a)/thickness,vec2f(1.0))-
      floor(b)-min(fract(b)/thickness,vec2f(1.0))
    )/(w/thickness);
    //pattern
    return (1.0-i.x)*(1.0-i.y);
}

const N = 1.0/200.0; // grid ratio

@fragment
fn fragmentMain( input: VertexOutput ) -> @location(0) vec4f {  

  // var gridA : f32 = 
  //   GradBox( input.texCoord, N/2.0 ) *
  //   GradBox( input.texCoord*10.0, N ) *
  //   GradBox( input.texCoord/10.0, N/5.0 );

  var grid = 
    PristineGrid( input.texCoord, N/2.0) *
    PristineGrid( input.texCoord*10.0, N) *
    PristineGrid( input.texCoord/10.0, N/5.0 );

  // var grid = select( gridA, gridB, input.texCoord.x + input.texCoord.y < 0.0 );
  return vec4f( uniforms.color, 1.0-grid );
}
`




export enum GridOrientation {
  NONE = 0,
  XY = 1,
  XZ = 2,
  YZ = 4,
}

export default class GridRenderer implements IRenderable {

  public get scale() {
    return this.uniformsData[3];
  }
  public set scale(value) {
    this.uniformsData[3] = value;
  }


  private _color! : vec3

  public get color() {
    return this._color;
  }
  public set color(value) {
    this._color = value;
    this.uniformsData.set(value);
  }

  private quad: Quad
  private pipeline: GPURenderPipeline
  private uniformsBuffer: GPUBuffer
  private uniformsData = new Float32Array(4)
  private bindGroupCommon: GPUBindGroup

  private bindGroupXY: GPUBindGroup
  private bindGroupXZ: GPUBindGroup
  private bindGroupYZ: GPUBindGroup

  public orientation: GridOrientation = GridOrientation.XZ


  constructor(private device: GPUDevice) {

    this.quad = new Quad(device)

    this.color = ColorUtils.HexToNewVec3(0x808080);
    this.scale = 50;

    const shader = device.createShaderModule({
      label: Label,
      code: WGSL,
    });

    this.pipeline = device.createRenderPipeline({
      label: Label,

      layout: device.createPipelineLayout({
        bindGroupLayouts: [
          CameraBindGroupFactory.getBindGroupLayout(device),
          device.createBindGroupLayout({
            entries: [
              { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer:{type: 'uniform' }},
            ],
          }),
          device.createBindGroupLayout({
            entries: [
              { binding: 0, visibility: GPUShaderStage.VERTEX, buffer:{type: 'uniform' }},
            ],
          }),
        ],
      
      }),

      primitive: {
        topology: 'triangle-strip',
      },
      vertex: {
        module: shader,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: 16,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" }, // position
          ],
        }],
      },
      
      fragment: {
        module: shader,
        entryPoint: 'fragmentMain',
        targets: [{ 
          format: navigator.gpu.getPreferredCanvasFormat(),
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha'
            },
            alpha: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha'
            },
          },
        }],
      },
      
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "less",
        format: "depth24plus",
      },
      
    });

    this.uniformsBuffer = device.createBuffer({
      label: `${Label} uniforms`,
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });


    this.bindGroupCommon = device.createBindGroup({
      label: 'Grid Common Uniforms',
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [
        { binding: 0, resource: { buffer: this.uniformsBuffer } },
      ],
    });

    const bufferXY = device.createBuffer({size: 16 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const bufferXZ = device.createBuffer({size: 16 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const bufferYZ = device.createBuffer({size: 16 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

    this.device.queue.writeBuffer(bufferXY, 0, mat4.create());
    this.device.queue.writeBuffer(bufferXZ, 0, mat4.fromXRotation(M4, Math.PI/2) );
    this.device.queue.writeBuffer(bufferYZ, 0, mat4.fromYRotation(M4, Math.PI/2) );

    this.bindGroupXY = device.createBindGroup({
      label: 'Grid XY',
      layout: this.pipeline.getBindGroupLayout(2),
      entries: [ { binding: 0, resource: { buffer: bufferXY } }],
    });

    this.bindGroupXZ = device.createBindGroup({
      label: 'Grid XZ',
      layout: this.pipeline.getBindGroupLayout(2),
      entries: [ { binding: 0, resource: { buffer: bufferXZ } }],
    });

    this.bindGroupYZ = device.createBindGroup({
      label: 'Grid YZ',
      layout: this.pipeline.getBindGroupLayout(2),
      entries: [ { binding: 0, resource: { buffer: bufferYZ } }],
    });

  }

  dispose(): void {
    
  }
   
  addedToRenderer(renderer: Renderer): void {

    // renderer.defaultPass.addBundle( (context) => {
    //   this.render( context );
    // }, () => {
    //   if( this.numInstances===0) return false;
    //   this.clear();
    //   return true;
    // })

    renderer.defaultPass.addCommands( (context) => {
      this.render( context );
    })


  }

  render(context: RenderActionContext): void {

    if (this.orientation === 0) return

    const pass = context.encoder;

    this.device.queue.writeBuffer(this.uniformsBuffer, 0, this.uniformsData);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, context.cameraBindGroup.getBindGroup());
    pass.setBindGroup(1, this.bindGroupCommon);
    pass.setVertexBuffer(0, this.quad.vertexBuffer);
    
    if (this.orientation & GridOrientation.XY) {
      pass.setBindGroup(2, this.bindGroupXY);
      pass.draw(4, 1);
    }

    if( this.orientation & GridOrientation.XZ ){
      pass.setBindGroup(2, this.bindGroupXZ);
      pass.draw(4, 1);
    }

    if( this.orientation & GridOrientation.YZ ){
      pass.setBindGroup(2, this.bindGroupYZ);
      pass.draw(4, 1);
    }
  }


}