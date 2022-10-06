import Vao from "nanogl-vao"
import ArrayBuffer from "nanogl/arraybuffer"
import IndexBuffer from "nanogl/indexbuffer"
import Program from "nanogl/program"
import { GLContext } from "nanogl/types"


export default class SpherePrimitive {

  vertices: ArrayBuffer
  indices: IndexBuffer
  vao: Vao

  
  constructor( gl:GLContext, rows=16 , cols=24){
    this.vertices = new ArrayBuffer( gl, this._createVertices(rows, cols) )
      .attrib( 'aPosition', 3, gl.FLOAT )
      .attrib( 'aTexCoord0', 2, gl.FLOAT )

    this.vertices.attribs.push({
      name: 'aNormal',
      size: 3,
      type: gl.FLOAT,
      offset: 0,
      stride: 5*4,
      normalize: false,
    })
    
    this.indices = new IndexBuffer( gl, gl.UNSIGNED_SHORT, this._createIndices(rows, cols) )
  }

  prepare(prg:Program){
    this.vertices.attribPointer( prg )
    this.indices.bind()
  }

  draw(){
    this.indices.drawTriangles()
  }



  /**
   * 
   * @param rows create unit sphere vertices with position x, y, z and uvs u, v, 5 float per vertex
   * @param cols 
   */
  _createVertices(rows:number, cols:number){

    const vertices = new Float32Array( (rows+1) * (cols+1) * 5 )
    
    let index = 0
    
    for (let i = 0; i <= rows; i++) {
      
      const v = i / (rows)
      const theta = v*Math.PI
      const sinTheta = Math.sin(theta)
      const cosTheta = Math.cos(theta)
      
      for (let j = 0; j <= cols; j++) {
        const u = j / cols

        const phi = u*2.0*Math.PI
        const sinPhi = Math.sin(phi)
        const cosPhi = Math.cos(phi)
        const x = cosPhi * sinTheta
        const y = cosTheta
        const z = sinPhi * sinTheta
        
        vertices[index++] = x
        vertices[index++] = y
        vertices[index++] = z
        vertices[index++] = u
        vertices[index++] = v
      }
    }
    return vertices
  }
  
  _createIndices(rows:number, cols:number){
    const indices = new Uint16Array( (rows) * (cols) * 6 )
    let index = 0
    for (let i = 0; i < rows ; i++) {
      for (let j = 0; j < cols ; j++) {
        const a = i * (cols+1) + j
        const b = a + 1
        const c = a + (cols+1)
        const d = c + 1
        indices[index++] = a
        indices[index++] = b
        indices[index++] = c
        indices[index++] = b
        indices[index++] = d
        indices[index++] = c
      }
    }
    return indices
  }
}