import type { PipelineGeometryData } from "../core/WgslSource";

const TMP_ARRAY = new Float32Array( [
  -1, -1, 0, 0,
  -1,  1, 0, 1,
   1, -1, 1, 0,
   1,  1, 1, 1
] );


/**
 * Simple 4 vertices Quad geometry
 */
export default class Quad {

  readonly vertexBuffer: GPUBuffer;

  static readonly pipelineGeometryData: PipelineGeometryData = {
    buffers: [{
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
    }],
    primitive: {
      topology: 'triangle-strip',
    },
  }


  constructor( readonly device: GPUDevice, x = -1, y = -1, w = 2, h = 2 ) {
    this.device = device;


    const a = TMP_ARRAY;
    a[0]  = a[4]  = x;
    a[1]  = a[9]  = y;
    a[8]  = a[12] = x+w;
    a[5]  = a[13] = y+h;

    this.vertexBuffer = device.createBuffer({
      label: "Cell vertices",
      size: a.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, a);

  
    // const vertexBufferLayout: GPUVertexBufferLayout = {
    //   arrayStride: 8,
    //   attributes: [{
    //     format: "float32x2",
    //     offset: 0,
    //     shaderLocation: 0, // Position. Matches @location(0) in the @vertex shader.
    //   }],
    // };

  }

}