import RenderPass from "../renderer/RenderPass"
import type Renderer from "../renderer/Renderer"


export default class SomeRenderable {

  constructor() {
    console.log("SomeRenderable constructor")
  }

  invalidate() {
    // all commands are invalidated created by this renderable are invalids and must be recreated
    // will call 
  }

  allocateResources(device, allocationContext): Promise<void> {
    // create pipelines, buffers, textures, samplers ...
  }

  dispose() {
    // free resources
  }

  addBundleOnPass() {

    return {

      default: (context) => {

      }

    }
  }

  addBundle(context) {
    
  }

  addedToRenderer( renderer : Renderer, hooks: RendererHooks ) {



    // renderer.addPass('myRenderableRTT', )

    // add commands on a GPURenderPassEncoder or a GPURenderBundleEncoder
    renderer.defaultPass.addCommands( (context) => {

      context.encoder.setPipeline()
      context.encoder.draw()
      // ...
    },
      {
        priority: 0,

      })

    // add commands on a GPURenderPassEncoder or a GPURenderBundleEncoder
    renderer.defaultPass.addBundle( (bundleEncoder, context) => {

      bundleEncoder.setPipeline()
      bundleEncoder.draw()
      // ...
    },
      {
        priority: 0,

      })

    if( material.castShadows ){
      renderer.getPass( 'depthPass' ).addCommands( (passEncoder, context) => {

        passEncoder.setPipeline()
        passEncoder.draw()
        // ...
      },
        {
          priority: 0,
  
        })
      }
    }


  }

}