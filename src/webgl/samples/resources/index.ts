import Delay from "@/core/Delay"
import { AbortController } from "@azure/abort-controller"
import gui from "@webgl/dev/gui"
import Renderer from "@webgl/Renderer"
import GltfResource from "@webgl/resources/GltfResource"
import { Resource } from "@webgl/resources/Resource"
import ResourceGroup from "@webgl/resources/ResourceGroup"
import { TextureResource } from "@webgl/resources/TextureResource"
import WebglAssets from "@webgl/resources/WebglAssets"
import { GltfScene } from "@webgl/engine/GltfScene"
import { IScene } from "@webgl/engine/IScene"

type ResourecFactory = () => Resource


/**
 * test a resource
 * when running it 
 *  - create, 
 *  - load
 *  - wait random delay
 *  - then abort
 *  - start again
 */
class ResourceTester {

  private _running = false

  public get running(): boolean {
    return this._running
  }

  public set running(value: boolean) {
    if (value !== this._running && value === true) {
      this.doLoadUnload()
    }
    this._running = value
  }

  public abortDelay = 200

  constructor( readonly name : string, private factory: ResourecFactory) {

  }




  async doLoadUnload() {

    const abortCtrl = new AbortController()
    const res = this.factory()

    res.load(abortCtrl.signal)
    await Delay(Math.random() * this.abortDelay)

    abortCtrl.abort()
    res.unload()

    await Delay(50)

    if (this.running)
      this.doLoadUnload()
  }



}

/**
 * Test resources system and cancelation ability
 * continuously create various types of resources, then load and abort them in mid air
 * to test for memory leaks or error when resources are cancelled during loading
 */
export default class ResourcesScene implements IScene {

  testers: ResourceTester[] = []
  texture: ResourceTester
  gltf: ResourceTester
  gltfScene: ResourceTester
  group: ResourceTester


  private _abortDelay = 200

  public get abortDelay() {
    return this._abortDelay
  }

  public set abortDelay(value) {
    this._abortDelay = value
    this.testers.forEach(t => t.abortDelay = value)
  }

  constructor(renderer: Renderer) {
    this.testers = [

      new ResourceTester('texture'  , () => new TextureResource(WebglAssets.getAssetPath("gltfs/suzanne/Suzanne_BaseColor.png"), renderer   )),
      new ResourceTester('timport'  , () => WebglAssets.getTexture( 'texture1', renderer.gl )),
      new ResourceTester('gltf'     , () => new GltfResource   ("gltfs/suzanne/Suzanne.gltf"         , renderer   )),
      new ResourceTester('gltfScene', () => new GltfScene      ("gltfs/suzanne/Suzanne.gltf"         , renderer.gl)),
      new ResourceTester('group', () => {
        const group = new ResourceGroup()
        group.add(new TextureResource(WebglAssets.getAssetPath("gltfs/suzanne/Suzanne_BaseColor.png"), renderer))
        group.add(new GltfResource("gltfs/suzanne/Suzanne.gltf", renderer))
        group.add(new GltfScene("gltfs/suzanne/Suzanne.gltf", renderer.gl))
        return group;
      }),

    ]


  }

  load(): Promise<void> {
    const folder = gui.folder("ResourcesScene")
    folder.range(this, 'abortDelay', 0, 1000, { step: 50 })
    this.testers.forEach(t => {
      t.running = true
      folder.add(t, 'running').setLabel(t.name)
    })
    folder.open()
    return Promise.resolve()
  }

  unload(): void {
    gui.clearFolder("ResourcesScene")
    this.testers.forEach(t => t.running = false)
  }

  preRender(): void {
    0;
  }

  rttPass(): void {
    0;
  }

  render(): void {
    0;
  }

}