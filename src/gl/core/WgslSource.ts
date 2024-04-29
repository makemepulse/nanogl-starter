import { ResourceType, WgslReflect, type Attribute, type VariableInfo } from "wgsl_reflect";


type DepthStencilOptions = Partial<GPUDepthStencilState>
type TargetConfig = Partial<GPUColorTargetState>

type RenderPipelineOptions = {
  depthStencil?: DepthStencilOptions
  targets?: TargetConfig[]
}

type ComputePipelineOptions = {
  constants?: Record<string, GPUPipelineConstantValue>
}

const CustomAttributes = [
  "format",
  "depthWrite",
  "depthCompare",
  "stencilFront",
  "stencilBack",
  "stencilReadMask",
  "stencilWriteMask",
  "depthBias",
  "depthBiasSlopeScale",
  "depthBiasClamp",
  "blend",
  "alphaBlend",
  "writeMask",
] as const

const DepthStencilFormats = new Set([
  "stencil8",
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",
  "depth32float-stencil8",
] as const)

const ColorTragetFormats = new Set([
  "r8unorm",
  "r8uint",
  "r8sint",
  "rg8unorm",
  "rg8uint",
  "rg8sint",
  "rgba8unorm",
  "rgba8uint",
  "rgba8sint",
  "bgra8unorm",
  "bgra8unorm",
  "r16uint",
  "r16sint",
  "r16float",
  "rg16uint",
  "rg16sint",
  "rg16float",
  "rgba16uint",
  "rgba16sint",
  "rgba16float",
  "r32uint",
  "r32sint",
  "r32float",
  "rg32uint",
  "rg32sint",
  "rg32float",
  "rgba32uint",
  "rgba32sint",
  "rgba32float",
  "rgb10a2uint",
  "rgb10a2unorm",
  "rg11b10ufloat",
] as const)

const DepthCompareFunctions = new Set([
  "never",
  "less",
  "equal",
  "less-equal",
  "greater",
  "not-equal",
  "greater-equal",
  "always",
] as const)


const StencilOperations = new Set([
  "keep",
  "zero",
  "replace",
  "invert",
  "increment-clamp",
  "decrement-clamp",
  "increment-wrap",
  "decrement-wrap",
] as const)

const BlendFactors = new Set([
  "zero",
  "one",
  "src",
  "one-minus-src",
  "src-alpha",
  "one-minus-src-alpha",
  "dst",
  "one-minus-dst",
  "dst-alpha",
  "one-minus-dst-alpha",
  "src-alpha-saturated",
  "constant",
  "one-minus-constant",
] as const)


const BlendOperations = new Set([
  "add",
  "subtract",
  "reverse-subtract",
  "min",
  "max",
] as const)

function hyphen( s:string ): string {
  return s.replaceAll( '_', '-' )
}

type SetType<T extends Set<any>> = T extends Set<infer K> ? K : never


export type PipelineGeometryData = {
  buffers?: Iterable<GPUVertexBufferLayout | null>,
  primitive: GPUPrimitiveState
}



export default class WgslSource {

  private _ast: WgslReflect;
  readonly module: GPUShaderModule;
  readonly layout: GPUPipelineLayout;

  constructor( protected device: GPUDevice, wgsl: string, readonly label?: string) {
    
    
    const code = this.normalizeCode(wgsl)
    
    this.module = device.createShaderModule({
      code,
      label,
    })
 
    try {
      this._ast = new WgslReflect(wgsl);
    } catch (e) {
      console.error(e)
      console.error(wgsl)
      throw new Error(`Failed to parse WGSL source code for ${label}`)
    }
 
    this.layout = this.device.createPipelineLayout({
      bindGroupLayouts: this.getBindGroupLayouts(),
    })

  }
  /**
   * remove all custom attributes from source code before compilation
   */
  private normalizeCode(code: string): string {
    console.log( `@(${CustomAttributes.join('|')})\\s*\\(.*?\\)` )
    const regex = new RegExp(`@(${CustomAttributes.join('|')})\\s*\\(.*?\\)`, 'g')
    return code.replace(regex, '')
  }

  hasAttribute( attributes: Attribute[], name: string ): boolean {
    return attributes.find( a=>a.name === name ) !== undefined
  }

  getAttributeFloat( attributes: Attribute[], name: string, defaultValue?: number ): number | undefined{
    const attr = attributes.find( a=>a.name === name );
    if( attr === undefined ) return defaultValue;
    if( attr.value === null || Array.isArray(attr.value) ) throw new Error(`Attribute ${name} is invalid: ${attr.value}`)
    const floatValue = parseFloat(attr.value)
    if( isNaN(floatValue) ) throw new Error(`Attribute ${name} is not a number`)
    return floatValue
  }

  getAttributeInt( attributes: Attribute[], name: string, defaultValue?: number ): number | undefined{
    const attr = attributes.find( a=>a.name === name );
    if( attr === undefined ) return defaultValue;
    if( attr.value === null || Array.isArray(attr.value) ) throw new Error(`Attribute ${name} is invalid: ${attr.value}`)
    const intValue = parseInt(attr.value)
    if( isNaN(intValue) ) throw new Error(`Attribute ${name} is not a number`)
    return intValue
  }

  getAttributeValue<TSet extends Set<string>>( typeSet: TSet, attributes: Attribute[], name: string, defaultValue: SetType<TSet> ): SetType<TSet>;
  getAttributeValue<TSet extends Set<string>>( typeSet: TSet, attributes: Attribute[], name: string ): SetType<TSet> | undefined;
  getAttributeValue<TSet extends Set<string>>( typeSet: TSet, attributes: Attribute[], name: string, defaultValue?: SetType<TSet> ): SetType<TSet>| undefined {
    const attr = attributes.find( a=>a.name === name );
    if( attr === undefined ) return defaultValue;
    if( attr.value === null || Array.isArray(attr.value) ) throw new Error(`Attribute ${name} is invalid: ${attr.value}`)
    const value = hyphen(attr.value) as SetType<TSet>
    if( ! typeSet.has(value) ){
      throw new Error(`Attribute ${name} has invalid value ${attr.value}`)
    }

    return value ?? defaultValue
  }

  getAttributeValueAt<TSet extends Set<string>>( typeSet: TSet, attributes: Attribute[], name: string, index: number , defaultValue: SetType<TSet> ): SetType<TSet>;
  getAttributeValueAt<TSet extends Set<string>>( typeSet: TSet, attributes: Attribute[], name: string, index: number ): SetType<TSet> | undefined;
  getAttributeValueAt<TSet extends Set<string>>( typeSet: TSet, attributes: Attribute[], name: string, index: number , defaultValue?: SetType<TSet> ): SetType<TSet>| undefined {
    const attr = attributes.find( a=>a.name === name );
    if( attr === undefined ) return defaultValue;
    if( ! Array.isArray(attr.value) ) throw new Error(`Attribute ${name} is not an array`)
    if( index >= attr.value.length ) return defaultValue
    const value = hyphen(attr.value[index]) as SetType<TSet>
    if( ! typeSet.has(value) ){
      throw new Error(`Attribute ${name} has invalid value ${value}`)
    }

    return value ?? defaultValue
  }

  isAttributeValue( attributes: Attribute[], name: string, value: string ): boolean {
    const attr = attributes.find( a=>a.name === name )
    if( attr === undefined ) return false;
    return attr.value === value
  }

  getDefaultEntry( stage : 'vertex'|'fragment'|'compute' ): string | null {
    const fragmentFunction = this._ast.functions.find(f => f.stage === stage )
    return fragmentFunction?.name ?? null;
  }

  getDepthStencilState(attributes: Attribute[] | null): GPUDepthStencilState {
    
    const depthStencil: GPUDepthStencilState = {
      format: 'depth24plus',
    }

    if (attributes !== null) {
      depthStencil.format              = this.getAttributeValue( DepthStencilFormats, attributes, 'format', 'depth24plus' )
      depthStencil.depthWriteEnabled   = this.isAttributeValue( attributes, 'depthWrite', 'on' )
      depthStencil.depthCompare        = this.getAttributeValue( DepthCompareFunctions, attributes, 'depthCompare' )
      
      depthStencil.stencilFront        = this.hasAttribute( attributes, 'stencilFront' ) ? {
        compare    : this.getAttributeValueAt( DepthCompareFunctions, attributes, 'stencilFront', 0 ),
        failOp     : this.getAttributeValueAt( StencilOperations    , attributes, 'stencilFront', 1 ),
        depthFailOp: this.getAttributeValueAt( StencilOperations    , attributes, 'stencilFront', 2 ),
        passOp     : this.getAttributeValueAt( StencilOperations    , attributes, 'stencilFront', 3 ),
      } : undefined;

      depthStencil.stencilBack         = this.hasAttribute( attributes, 'stencilBack' ) ? {
        compare    : this.getAttributeValueAt( DepthCompareFunctions, attributes, 'stencilBack', 0 ),
        failOp     : this.getAttributeValueAt( StencilOperations    , attributes, 'stencilBack', 1 ),
        depthFailOp: this.getAttributeValueAt( StencilOperations    , attributes, 'stencilBack', 2 ),
        passOp     : this.getAttributeValueAt( StencilOperations    , attributes, 'stencilBack', 3 ),
      } : undefined;

      depthStencil.stencilReadMask     = this.getAttributeInt( attributes, 'stencilReadMask' )
      depthStencil.stencilWriteMask    = this.getAttributeInt( attributes, 'stencilWriteMask' )
      depthStencil.depthBias           = this.getAttributeFloat( attributes, 'depthBias' )
      depthStencil.depthBiasSlopeScale = this.getAttributeFloat( attributes, 'depthBiasSlopeScale' )
      depthStencil.depthBiasClamp      = this.getAttributeFloat( attributes, 'depthBiasClamp' )
      
    }



    return depthStencil;
  }


  getColorTargetState(attributes: Attribute[] | null ): GPUColorTargetState {

    const state: GPUColorTargetState = {
      format: 'bgra8unorm',
    }

    if (attributes !== null) {
      state.format = this.getAttributeValue( ColorTragetFormats, attributes, 'format', 'bgra8unorm' )

      const colorBlend = this.hasAttribute( attributes, 'blend' ) ? {
        srcFactor: this.getAttributeValueAt( BlendFactors, attributes, 'blend', 0 ),
        dstFactor: this.getAttributeValueAt( BlendFactors, attributes, 'blend', 1 ),
        operation: this.getAttributeValueAt( BlendOperations, attributes, 'blend', 2 ),
      } : {}

      const alphaBlend = this.hasAttribute( attributes, 'alphaBlend' ) ? {
        srcFactor: this.getAttributeValueAt( BlendFactors, attributes, 'alphaBlend', 0 ),
        dstFactor: this.getAttributeValueAt( BlendFactors, attributes, 'alphaBlend', 1 ),
        operation: this.getAttributeValueAt( BlendOperations, attributes, 'alphaBlend', 2 ),
      } : colorBlend

      state.blend = {
        color: colorBlend,
        alpha: alphaBlend,
      }

      state.writeMask = this.getAttributeInt( attributes, 'writeMask' )
      
    }
    return state;
  }

  getVariableVisibility( variable: VariableInfo ): GPUShaderStageFlags {
    let visibility: GPUShaderStageFlags = 0
    for( const func of this._ast.functions ){
      if( func.resources.includes(variable) ){
        let fVis : GPUShaderStageFlags = 0
        switch (func.stage){
          case 'vertex'  : fVis = GPUShaderStage.VERTEX  ; break;
          case 'fragment': fVis = GPUShaderStage.FRAGMENT; break;
          case 'compute' : fVis = GPUShaderStage.COMPUTE ; break;
        }

        visibility |= fVis
      }
    }
    return visibility
  }

  private getGPUBindGroupLayoutEntry(variable: VariableInfo): GPUBindGroupLayoutEntry {
  
    const entry: GPUBindGroupLayoutEntry = {
      binding: variable.binding,
      visibility: this.getVariableVisibility(variable),
    }
  
    switch (variable.resourceType) {
      case ResourceType.Uniform:
        entry.buffer = { type: "uniform" }
        break;
      case ResourceType.Storage:
        // entry.buffer = { type: "storage" }
        entry.buffer = { type: (variable.access==='read_write') ? "storage" : "read-only-storage" }
        break;
      case ResourceType.Texture:
        entry.texture = { sampleType: 'float' }
        break;
      case ResourceType.Sampler:
        entry.sampler = {}
        break;
    }
    return entry
  
  }
  
  private getBindGroupLayout( variables: VariableInfo[] ): GPUBindGroupLayout {
    const layoutDescriptor = this.getBindGroupLayoutDescriptor( variables )
    console.log( layoutDescriptor )
    return this.device.createBindGroupLayout( layoutDescriptor )
  }

  private getBindGroupLayoutDescriptor( variables: VariableInfo[] ): GPUBindGroupLayoutDescriptor {
    return {
      label: `${this.label ?? ''} BindGroupLayout`,
      entries: variables.map(variable => this.getGPUBindGroupLayoutEntry(variable))
    }
  }

  getBindGroupLayouts(): GPUBindGroupLayout[] {
    return this._ast.getBindGroups().map( variables => this.getBindGroupLayout( variables ) )
  }

  createComputePipelineAsync( entry?: string, pipelineConfig?: ComputePipelineOptions): Promise<GPUComputePipeline> {

    const computeEntry = entry ?? this.getDefaultEntry('compute');
    if (computeEntry === null) throw new Error('No compute entry found')

    const computeFunc = this._ast._functions.get(computeEntry);

    if (computeFunc === undefined) throw new Error(`Compute function ${computeEntry} not found`)


    const pipelineDescriptor: GPUComputePipelineDescriptor = {
      label: 'TexturedQuadRenderable',
      layout: this.layout,

      compute: {
        module: this.module,
        entryPoint: computeEntry,
        constants: pipelineConfig?.constants,
      },
    }

    // console.log( pipelineDescriptor )
    return this.device.createComputePipelineAsync( pipelineDescriptor );
  }

  createRenderPipelineAsync( geometry: PipelineGeometryData, pvertexEntry?: string, pfragmentEntry?: string, pipelineConfig?: RenderPipelineOptions): Promise<GPURenderPipeline> {

    const vertexEntry = pvertexEntry ?? this.getDefaultEntry('vertex');
    const fragmentEntry = pfragmentEntry ?? this.getDefaultEntry('fragment');

    if (vertexEntry === null) throw new Error('No vertex entry found')
    if (fragmentEntry === null) throw new Error('No fragment entry found')

    const vertexFunc = this._ast._functions.get(vertexEntry);
    const fragmentFunc = this._ast._functions.get(fragmentEntry);

    if (vertexFunc === undefined) throw new Error(`Vertex function ${vertexEntry} not found`)
    if (fragmentFunc === undefined) throw new Error(`Fragment function ${fragmentEntry} not found`)

    const fragFuncAttributes = fragmentFunc.node.attributes


    const globalColorState: GPUColorTargetState = this.getColorTargetState(fragFuncAttributes)

    const numTargets = fragmentFunc.info?.outputs.length ?? 1
    const targets: GPUColorTargetState[] = []
    for (let i = 0; i < numTargets; i++) {
      targets.push( {
        ...globalColorState,
        ...pipelineConfig?.targets?.[i]
      })
    }

    const depthStencil: GPUDepthStencilState = {
      ...this.getDepthStencilState(fragFuncAttributes),
      ...pipelineConfig?.depthStencil
    }

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label: 'TexturedQuadRenderable',
      layout: this.layout,

      depthStencil,

      primitive: geometry.primitive,

      vertex: {
        module: this.module,
        entryPoint: vertexEntry,
        buffers: geometry.buffers,
      },
      fragment: {
        module: this.module,
        entryPoint: fragmentEntry,
        targets,
      },
    }

    // console.log( pipelineDescriptor )
    return this.device.createRenderPipelineAsync( pipelineDescriptor );

  }



}