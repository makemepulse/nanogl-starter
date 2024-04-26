import type Camera from "nanogl-camera";
import { ResourceType, WgslReflect, type VariableInfo } from "wgsl_reflect";




function CreateVariableFromVariableInfo(device: GPUDevice, variable: VariableInfo): Binding {
  
  switch (variable.resourceType) {
    case ResourceType.Texture:
      return new TextureBinding(device, variable)
    case ResourceType.Sampler:
      return new SamplerBinding(device, variable)
    case ResourceType.Storage:
    case ResourceType.Uniform:
      return new DataBinding(device, variable)
    case ResourceType.StorageTexture:
      throw new Error('StorageTexture not implemented')

  }
}

enum BindingType {
  Data,
  Texture,
  Sampler,
}


abstract class AbstractBinding {

  abstract readonly type : BindingType

  private _resourceInvalidated = true;

  public get resourceInvalidated() {
    return this._resourceInvalidated;
  }

  invalidateResource() {
    this._resourceInvalidated = true;
  }

  get binding(){
    return this.infos.binding
  }

  get size(){
    return this.infos.size
  }

  get name(){
    return this.infos.name
  }

  abstract getResource(): GPUBindingResource;
  
  abstract updateResource(): void;

  constructor( protected device: GPUDevice, protected infos: VariableInfo) {

    // this._data = new Float32Array( this._dataBuffer )
  }


}


export class TextureBinding extends AbstractBinding {

  readonly type = BindingType.Texture

  private _texture: GPUTexture | null = null

  setTexture(texture: GPUTexture) {
    this._texture = texture
    this.invalidateResource()
  }

  constructor(device: GPUDevice, infos: VariableInfo) {
    super(device, infos)
  }


  getResource(): GPUTextureView {
    if( this._texture === null ) throw new Error('Texture not set')
    return this._texture.createView()
  }

  updateResource():void {/* noop */}
  
}


export class SamplerBinding extends AbstractBinding {

  readonly type = BindingType.Sampler
  
  readonly sampler: GPUSampler;
  
  constructor(device: GPUDevice, infos: VariableInfo) {
    super(device, infos)
    this.sampler = device.createSampler();
  }
  
  getResource(): GPUSampler {
    return this.sampler
  }
  
  updateResource():void {/* noop */}

}


export class DataBinding extends AbstractBinding {

  readonly type = BindingType.Data

  private _dataBuffer: ArrayBuffer
  private _f32data: Float32Array
  private _u8data: Uint8Array
  private _gpuBuffer: GPUBuffer
  private _dataInvalidated = true

  constructor(device: GPUDevice, infos: VariableInfo) {
    super(device, infos)

    this._gpuBuffer = device.createBuffer({
      size: this.size,
      usage: GPUBufferUsage.COPY_DST | ((infos.resourceType === ResourceType.Uniform) ? GPUBufferUsage.UNIFORM : GPUBufferUsage.STORAGE),
    })

    const paddedSize = Math.ceil(this.size / 32) * 32
    this._dataBuffer = new ArrayBuffer(paddedSize)
    this._f32data = new Float32Array(this._dataBuffer)
    this._u8data = new Uint8Array(this._dataBuffer)

  }


  updateResource() {
    if( this._dataInvalidated ) {
      this.device.queue.writeBuffer(this._gpuBuffer, 0, this._dataBuffer, 0, this.size)
      this._dataInvalidated = false
    }
  }

  getResource(): GPUBindingResource {
    return {
      buffer: this._gpuBuffer,
      offset: 0,
      size: this.size
    }
  }

  setFloats(values: ArrayLike<number>, offset: number = 0) {
    this._f32data.set(values, offset)
    this.invalidateData()
  }
 
  setBytes(value: Uint8Array, offset: number = 0) {
    this._u8data.set(value, offset)
    this.invalidateData()
  }

  invalidateData() {
    this._dataInvalidated = true
  }


}


export type Binding = TextureBinding | SamplerBinding | DataBinding

export class BindGroup {

  private _variables: Binding[] = []
  private _variablesByName = new Map<string, Binding>()
  private _gpuBbindGroup: GPUBindGroup | null = null;

  constructor(protected device: GPUDevice, private uniformGroup: BindGroupFactory) {
    const variableInfos = this.uniformGroup.ast.getBindGroups()[0]
    this._variables = variableInfos.map( infos=>CreateVariableFromVariableInfo(this.device, infos) )
    this._variables.forEach( v=>this._variablesByName.set(v.name, v) )
  }

  getBindGroup() {
    if( this._gpuBbindGroup === null || this._variables.some( v=>v.resourceInvalidated ) ) {
      this._gpuBbindGroup = this._createBindGroup()
    }
    return this._gpuBbindGroup
  }

  getVariable( name: string ) : Binding {
    const variable = this._variablesByName.get(name)
    if( variable === undefined ) throw new Error(`Variable ${name} not found`)
    return variable
  }

  getDataVariable( name: string ) : DataBinding {
    const variable = this.getVariable(name)
    if( variable.type !== BindingType.Data ){
      throw new Error(`Variable ${name} is not a DataBinding`)
    }
    return variable
  }

  updateResouces() {
    this._variables.forEach( v=>v.updateResource() )
  }

  private _createBindGroup(): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.uniformGroup.getBindGroupLayout(this.device),
      entries: this._createBindGroupEntries(),
    })
  }

  private _createBindGroupEntries(): GPUBindGroupEntry[] {
    return this._variables.map(variable => ({
      binding: variable.binding,
      resource: variable.getResource(),
    }))

  }

}






export default abstract class BindGroupFactory {

  readonly ast: WgslReflect

  constructor() {

    this.ast = new WgslReflect( this.getWgslDeclaration(0) );

    // console.log(this.ast)
    // console.log(this.ast.getBindGroups())
  }


  createBindGroup(device: GPUDevice):BindGroup {
    return new BindGroup(device, this)
  }


  abstract getWgslDeclaration(group: GPUIndex32): string;

  getVariableVisibility( variable: VariableInfo ): GPUShaderStageFlags {
    let visibility: GPUShaderStageFlags = 0
    for( const func of this.ast.functions ){
      if( func.resources.includes(variable) ){
        let fVis : GPUShaderStageFlags = 0
        switch (func.stage){
          case 'vertex'  : fVis = GPUShaderStage.VERTEX  ; break;
          case 'fragment': fVis = GPUShaderStage.FRAGMENT; break;
          case 'compute' : fVis = GPUShaderStage.COMPUTE ; break;
        }

        visibility |= fVis
      }
    }
    return visibility
  }


  getGPUBindGroupLayoutEntry(variable: VariableInfo): GPUBindGroupLayoutEntry {
    const entry: GPUBindGroupLayoutEntry = {
      binding: variable.binding,
      visibility:  GPUShaderStage.VERTEX//this.getVariableVisibility(variable)
    }

    switch (variable.resourceType) {
      case ResourceType.Uniform:
        entry.buffer = { type: "uniform" }
        break;
      case ResourceType.Storage:
        // entry.buffer = { type: "storage" }
        entry.buffer = { type: (variable.access==='read_write') ? "storage" : "read-only-storage" }
        break;
      case ResourceType.Texture:
        entry.texture = { sampleType: 'float' }
        break;
      case ResourceType.Sampler:
        entry.sampler = {}
        break;
    }
    return entry

  }

  getBindGroupLayoutDescriptor(): GPUBindGroupLayoutDescriptor {
    const variables = this.ast.getBindGroups()[0]
    return {
      label: 'TODO name',
      entries: variables.map(variable => this.getGPUBindGroupLayoutEntry(variable))
    }
  }

  getBindGroupLayout( device : GPUDevice ): GPUBindGroupLayout {
    const layoutDescriptor = this.getBindGroupLayoutDescriptor()
    return device.createBindGroupLayout( layoutDescriptor )
  }


}




export class CameraBindGroupFactoryClass extends BindGroupFactory {

  getWgslDeclaration( group: GPUIndex32 ): string {
    return /* wgsl */`
      struct CameraUniforms {
        viewProj: mat4x4<f32>,
        view: mat4x4<f32>,
        proj: mat4x4<f32>,
        worldPos: vec3<f32>,
      };

      @group(${group}) @binding(0) var<uniform> camera: CameraUniforms;
    `
  }

  constructor() {
    super()
  }

  // Helpers

  private _cameraData = new Float32Array(16+16+16+3)

  getCameraData( camera: Camera ): Float32Array {
    this. _cameraData .set(camera. _viewProj                  , 0 )
    this. _cameraData .set(camera. _view                      , 16)
    this. _cameraData .set(camera. lens       .getProjection(), 32)
    this. _cameraData .set(camera. _wposition                 , 48)

    return this._cameraData
  }

  updateCameraData( bindGroup: BindGroup, camera: Camera ): void {
    bindGroup.getDataVariable('camera').setFloats( this.getCameraData(camera) )
    bindGroup.updateResouces()
  }

}


export const CameraBindGroupFactory = new CameraBindGroupFactoryClass()




export class SomeUniforms extends BindGroupFactory {
  getWgslDeclaration(group: number): string {
    return /* wgsl */`

    struct SubStruct {
      a: f32,
      b: f32,
      c: vec3f,
    };
    
    struct SomeRay {
      origin: vec3f,
      sub: SubStruct,
      direction: vec3f,
    };
    
    struct SomePlane {
      normal: vec3f,
      distance: f32,
      truc: f32,
    };
    
    @group(${group}) @binding(0) var<uniform> plane: SomePlane;
    @group(${group}) @binding(1) var<uniform> ray: SomeRay;
    @group(${group}) @binding(2) var<uniform> someColor: vec3f;
    
    @group(${group}) @binding(3) var pSampler: sampler;
    @group(${group}) @binding(4) var pTexture: texture_2d<f32>;
    
    @group(${group}) @binding(5) var<uniform> someHalf: vec3h;
    @group(${group}) @binding(6) var<storage, read_write> storageArray: array<vec2i>;
    @group(${group}) @binding(7) var<uniform> uArray: array<vec2f, 8>;
    
    `
  }

  constructor() {
    super()
  }


}
