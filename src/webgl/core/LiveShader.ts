import { GlslModule } from "@webgl/glsl/glslModule";

/// #if DEBUG

/**
 * Wrap a glsl import module to a GlslModule which return up to date code when HMR is triggered
 * @param glslModule 
 * @returns 
 */
export default function LiveShader(glslModule:GlslModule ): GlslModule {
  let uptodateModule = glslModule
  glslModule.onHmr(m=>uptodateModule=m)
  const fn:GlslModule = function(o?:unknown){
    return uptodateModule(o)
  }
  fn.toString=fn;
  fn.onHmr= (l)=>uptodateModule.onHmr(l);
  return fn
}


/// #else
/// #code export default function LiveShader(glslModule:GlslModule ): GlslModule { return glslModule }
/// #endif