import { mat4, type mat3, type vec2, type vec3, type vec4 } from "gl-matrix"
import type { StructInfo, TemplateInfo, TypeInfo, VariableInfo, WgslReflect } from "wgsl_reflect"


class UniformsValue {
  
  private _f32_view: Float32Array | null = null
  private _u32_view: Uint32Array | null = null
  private _i32_view: Int32Array | null = null
  
  private _members: Map<string, UniformsValue> = new Map()

  member( name: string ): UniformsValue {
    const member = this._members.get( name )
    if( member === undefined ) throw new Error(`Member ${name} not found`)
    return member
  }

  constructor(protected _data: ArrayBuffer, private _infos: TypeInfo, protected _bufferOffset: number = 0) {
  
    if( _infos.isStruct ){
      const infos = _infos as StructInfo
      for( const member of infos.members ){
        this._members.set( member.name, new UniformsValue( _data, member.type, member.offset ) )
      }
    }
  }

  set value( v: number ){
    this.f32[0] = v
  }

  get value(): number {
    return this.f32[0]
  }

  get mat4(): mat4 {
    if( this._infos.name !== 'mat4x4' ) throw new Error('Invalid type')
    return this.f32 as mat4
  }

  get mat3(): mat3 {
    if( this._infos.name !== 'mat3x3' ) throw new Error('Invalid type')
    return this.f32 as mat3
  }

  get f32() {
    if( this._f32_view === null ) this._f32_view = new Float32Array( this._data, this._bufferOffset, this._infos.size / 4)
    return this._f32_view
  }

  get u32() {
    if( this._u32_view === null ) this._u32_view = new Uint32Array( this._data, this._bufferOffset, this._infos.size / 4)
    return this._u32_view
  }

  get i32() {
    if( this._i32_view === null ) this._i32_view = new Int32Array( this._data, this._bufferOffset, this._infos.size / 4)
    return this._i32_view
  }

}


export class Uniform extends UniformsValue {

  private _buffer: GPUBuffer | null = null
  private _needUpdate = true;

  constructor( private _device: GPUDevice, varinfos: VariableInfo ) {
    const data = new ArrayBuffer( varinfos.size )
    super( data, varinfos, 0 )
  }
  
  getBuffer(): GPUBuffer {
    if( this._needUpdate ) this._update()
    return this._buffer!
  }
  
  
  _update() {
    if( this._buffer === null ) {
      this._buffer = this._device.createBuffer( { 
        size: this._data.byteLength, 
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST 
      })
    }

    this._device.queue.writeBuffer( this._buffer, 0, this._data )
  }
  
}




// usage 

// const uniforms = new Uniform( device, infos )

// uniforms.viewProj.mat4.set( camera.viewProj )
// const matrix = new Uniform( device, infos )
// matrix.mat4.set( mat4.create() )