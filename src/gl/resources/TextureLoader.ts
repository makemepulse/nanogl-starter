
import TextureData, { RawTextureData, TextureDataType, UncompressedTextureData } from "./TextureData";



export default class TexturesLoader {


  constructor(readonly device: GPUDevice) {

  }


  upload(data: TextureData): GPUTexture {

    const source = data.sources[0];

    const texture = this.device.createTexture({
      size: {
        width: data.width,
        height: data.height,
        depthOrArrayLayers: source.surfaces.length
      },
      format: data.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      mipLevelCount: source.surfaces[0].length,
      sampleCount: 1
    })


    const lod = 0;


    this.uploadTexture(texture, data, lod);

    return texture;

  }


  private uploadTexture(texture: GPUTexture, data: TextureData, lod = 0) {
    for (let surface = 0; surface < data.sources[lod].surfaces.length; surface++) {
      this.uploadAllSurfaceLevels(texture, data, lod, surface)
    }
  }



  private uploadAllSurfaceLevels(texture: GPUTexture, data: TextureData, lod: number, surface: number): void {
    switch (data.datatype) {

      case TextureDataType.IMAGE:
        this.uploadLevels(texture, data, lod, surface);
        break
      
      case TextureDataType.RAW:
        this.uploadLevelsRaw(texture, data, lod, surface);
        break
      
    }
  }




  private uploadLevels(texture: GPUTexture, data: UncompressedTextureData, lod: number, surface: number): void {

    const source = data.sources[lod];
    const levels = source.surfaces[surface];


    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {

      this.device.queue.copyExternalImageToTexture({
        source: levels[levelIndex].data,
        flipY: false,
      }, {
        texture: texture,
        mipLevel: levelIndex,
        origin: { x: 0, y: 0, z: surface }
      }, {
        width: levels[levelIndex].width,
        height: levels[levelIndex].height,
      })

    }
  }

  private uploadLevelsRaw(texture: GPUTexture, data: RawTextureData, lod: number, surface: number): void {

    const source = data.sources[lod];
    const levels = source.surfaces[surface];


    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      const level = levels[levelIndex];

      this.device.queue.writeTexture(
        {
          texture,
          mipLevel: levelIndex,
        },
        level.data,
        {

        },
        {
          width: level.width,
          height: level.height,
        }
      )
    }
  }


}