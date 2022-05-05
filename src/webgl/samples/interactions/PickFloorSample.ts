import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import { IGLContextProvider } from "@webgl/resources/IGLContextProvider"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import Lighting from "@webgl/engine/Lighting"
import Plane from "@webgl/math/Plane"
import { vec3 } from "gl-matrix"
import Ray from "@webgl/math/Ray"
import rayPlaneIntersection from "@webgl/math/rayPlaneIntersection"
import DebugDraw from "@webgl/dev/debugDraw/DebugDraw"
import { Pointer } from "@webgl/core/Pointers"

const ORIGIN = vec3.create()
const V3 = vec3.create()
const XZPlane = new Plane()
const ray = new Ray()

export default class PickFloorSample implements IGLContextProvider, IScene {

  readonly gl: GLContext

  constructor(private renderer: Renderer) {
    this.gl = renderer.gl
  }


  preRender(): void {
    this.handlePointer(this.renderer.pointers.primary, 'primary')
    this.handlePointer(this.renderer.pointers.secondary, 'secondary')
  }


  handlePointer(pointer: Pointer, name: string) {
    if (pointer.isDown()) {
      ray.unproject(pointer.coord.viewport, this.renderer.camera)
      if( rayPlaneIntersection(V3, ray, XZPlane) ) {
        DebugDraw.drawGuizmo(V3)
        DebugDraw.drawLine(ORIGIN, V3)
        V3[1] += 1
        const text = `${name}
${pointer.lastEvent?.isPrimary}
${pointer.lastEvent?.type}
${pointer.lastEvent?.pointerId}
`
        DebugDraw.drawText(text, V3)
        
      }
    }
  }


  load(): Promise<void> {
    return Promise.resolve()
  }


  rttPass(): void { 0 }
  render(): void { 0 }
  unload(): void { 0 }

}