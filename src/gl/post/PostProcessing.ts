import type { AnyPromise } from "../../utils/AnyPromise";
import RenderPass from "../renderer/RenderPass";
import type { RenderViewContext } from "../renderer/RenderViewContext";
import type { IRenderable } from "../renderer/Renderable";
import type Renderer from "../renderer/Renderer";
import { RendererTextureTarget } from "../renderer/RendererTarget";

export default class PostProcessing implements IRenderable {

  private _renderTarget: RendererTextureTarget;

  

  constructor( private device: GPUDevice ) {
    this._renderTarget = new RendererTextureTarget( device )
  }

  ready?: AnyPromise | undefined;
  
  getRenderView(): GPUTextureView {
    return this._renderTarget.createColorAttachmentView()
  }

  dispose(): void {
    throw new Error("Method not implemented.");
  }

  addedToRenderer(renderer: Renderer): void {

    const postPass = new RenderPass( renderer, 'postprocessing')
    renderer.addPass( postPass )

    // postPass.addCommands

  }

  prepare( context: RenderViewContext ) {
    this._renderTarget.setSize( context.target.width, context.target.height )


  }

}