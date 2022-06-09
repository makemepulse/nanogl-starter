import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { IScene } from "@webgl/engine/IScene"
import { TextureCubeResource } from "@webgl/resources/TextureResource"
import WebglAssets from "@webgl/resources/WebglAssets"
import Rect from "nanogl-primitives-2d/rect"
import Programs from "@webgl/glsl/programs"
import Program from "nanogl/program"
import { mat4 } from "gl-matrix"

const M4 = mat4.create()

export default class TextureCubeSample implements IScene {

  readonly gl: GLContext

  root: Node

  quad: Rect
  cubeTex: TextureCubeResource
  prg: Program


  constructor(private renderer: Renderer) {

    this.gl = renderer.gl
    this.root = new Node()
    this.quad = new Rect(this.gl)

    this.cubeTex = new TextureCubeResource({
      sources: [
        {
          codec: 'std', lods: [
            {
              files: [
                WebglAssets.getAssetPath('sample/cube_car/posx.jpg'),
                WebglAssets.getAssetPath('sample/cube_car/posy.jpg'),
                WebglAssets.getAssetPath('sample/cube_car/posz.jpg'),
                WebglAssets.getAssetPath('sample/cube_car/negx.jpg'),
                WebglAssets.getAssetPath('sample/cube_car/negy.jpg'),
                WebglAssets.getAssetPath('sample/cube_car/negz.jpg'),
              ]
            }
          ]
        }
      ]
    }, this.gl)

    this.prg = Programs(this.gl).get('skybox')


  }

  preRender(): void {
    this.root.updateWorldMatrix()
  }

  rttPass(): void {
    0
  }

  render(context: RenderContext): void {
    this.prg.use()
    M4.set( context.camera._viewProj )
    M4[12] = M4[13] = M4[14] = 0

    mat4.invert(M4, M4)
    this.prg.uUnproject( M4 )
    this.prg.tCubemap( this.cubeTex )

    this.quad.attribPointer(this.prg)
    this.quad.render()
  }

  load(): Promise<void> {
    return this.cubeTex.load().then()
  }

  unload(): void {
    0
  }

}