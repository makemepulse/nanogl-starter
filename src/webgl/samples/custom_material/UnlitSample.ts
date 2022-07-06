import { RenderContext } from "@webgl/core/Renderer"
import Renderer from "@webgl/Renderer"
import Node from "nanogl-node"
import { GLContext } from "nanogl/types"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"
import AssetDatabase from "@webgl/resources/AssetDatabase"
import UnlitPass from "nanogl-pbr/UnlitPass"
import TexCoord from "nanogl-pbr/TexCoord"


/**
 * Illustrate creation of a MaterialPass from scratch
 */
export default class UnlitSample implements IScene {

  readonly gl: GLContext
  gltfSample: GltfScene
  root: Node
  unlitPass: UnlitPass

  constructor(renderer: Renderer) {
    this.gl = renderer.gl
    this.root = new Node()

    this.unlitPass = new UnlitPass()
    this.unlitPass.glconfig
      .enableDepthTest()
      .enableCullface()

    this.gltfSample = new GltfScene( 'samples/room/room.glb', this.gl, null, this.root)

    /**
     * completely replace the gltf material with les clearcoat one
     */
    this.gltfSample.overrides.overridePass("", this.unlitPass)
    

  }



  preRender(): void {
    this.gltfSample.preRender()
    this.root.updateWorldMatrix()
  }

  
  render(context: RenderContext): void {
    this.gltfSample.render(context)
  }
  
  async load(): Promise<void> {
    await this.gltfSample.load()
    await this.loadLightmap()
  }

  async loadLightmap(){
    const lightmap = AssetDatabase.getTexture( 'samples/room/lightmap.jpg', this.gl )
    await lightmap.load()
    const tc = TexCoord.create('aTexCoord1')
    this.unlitPass.baseColor.attachSampler('basecolor', tc ).set( lightmap.texture )
  }
  
  unload(): void {0}
  
  rttPass(): void {0}
}