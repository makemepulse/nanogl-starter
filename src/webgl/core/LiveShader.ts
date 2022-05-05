import { GlslModule } from "@webgl/glsl/glslModule";
import Program from "nanogl/program";
import { GLContext } from "nanogl/types";

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

/**
 * Return a program which automatically recompile when one of its shader is updated by HMR
 * @param gl 
 * @param vert 
 * @param frag 
 * @param defs 
 * @returns 
 */
export function LiveProgram( gl:GLContext, vert:GlslModule, frag:GlslModule, defs?:string ): Program {
  const prg = new Program(gl)
  const lv = LiveShader(vert)
  const lf = LiveShader(frag)
  const compile = ()=>prg.compile(lv(), lf(), defs)
  compile()
  lv.onHmr(compile)
  lf.onHmr(compile)
  return prg
}


/// #else
/// #code export default function LiveShader(glslModule:GlslModule ): GlslModule { return glslModule }
/// #code export function LiveProgram( gl:GLContext, vert:GlslModule, frag:GlslModule ): Program { return new Program(gl, vert(), frag()); }
/// #endif