

export interface IndicesData {
  buffer : ArrayBuffer
  gltype : number
}

export interface IAttribute {
  buffer : ArrayBuffer
  
  semantic      : string
  componentType : number
  numComps      : number
  normalized    : boolean
  byteOffset    : number
  _stride       : number
}

export interface IDracoGeometry {
  attributes : IAttribute[]
  indices : IndicesData
  numIndices : number
  numVertices : number
}

type Semantic = string

export interface IDracoRequest {
  buffer : ArrayBuffer
  attributes? : Record<Semantic,number>
}

export interface IDracoResponse {
  error? : string
  geometry : IDracoGeometry
}
