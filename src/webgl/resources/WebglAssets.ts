
import { GLContext } from "nanogl/types"
import { ITextureRequest, ITextureOptions, ITextureRequestSource } from "./TextureRequest"
import { TextureResource } from "./TextureResource"


function getFileContext(){
  return require.context( '@/assets/webgl/', true, /.*/i )
}

const _files = getFileContext()
const _contextId = _files.id

const _assetsByPath:Map<string, FileInfos> = new Map()
const _assetsByName:Map<string, FileInfos> = new Map()
const _assets:FileInfos[] = []
const _textures:Map<string, TextureAsset> = new Map()




type FileInfos = {
  initialPath:  string, 
  path:  string, 
  group : string
  name  : string
  ext   : string
  meta ?: string
}


function parsePath( initialPath: string, path: string  ): FileInfos {

  initialPath = initialPath.substring(2, initialPath.length )
  const sep = initialPath.lastIndexOf( '/' )
  const group = initialPath.substring(0, sep)
  const filename = initialPath.substring( sep+1, initialPath.length )

  const regexp = /^(.+)\.(\w+)(\.(.*))?/
  const r = regexp.exec( filename )
  
    
  const name  = r[1]
  const ext   = r[2]
  const meta  = r[4]
  return {
    initialPath,
    path,
    group,
    name,
    ext,
    meta,
  }

} 


const CODECS_PRIO: Record<string, number> = {
  'astc':0,
  'pvr' :1,
  'dxt' :1,
  'etc' :1,
  'webp':2,
  'std' :3,
}

function getTextureCodec( fileInfos : FileInfos ): string {
  switch (fileInfos.meta) {
    case 'astc.ktx': return 'astc'
    case 'pvr.ktx' : return 'pvr'
    case 'dxt.ktx' : return 'dxt'
    case 'etc.ktx' : return 'etc'
    case 'webp'    : return 'webp'
    case undefined : return 'std'
  }
  throw new Error("unsupported file "+fileInfos.initialPath);
}

function sortTexSources(sa: ITextureRequestSource, sb: ITextureRequestSource):number {
  return CODECS_PRIO[sa.codec] - CODECS_PRIO[sb.codec]
}


class TextureAsset implements ITextureRequest {

  options: ITextureOptions;
  sources: ITextureRequestSource[] = []

  /// #if DEBUG
  _resources: TextureResource[] = []
  /// #endif

  addSource( fileInfos:FileInfos  ){
    const codec = getTextureCodec( fileInfos )
    this.sources.push( {
      codec,
      lods : [{files:[fileInfos.path], buffers:null}],
      datas : null
    })
    this.sources.sort( sortTexSources )
  }


}

function isTexture(fileInfos: FileInfos) {
  const ext = fileInfos.ext
  return ext === 'jpg' || ext === 'png'
}


function handleFile( initialPath: string, path: string ){
  const fileInfos = parsePath( initialPath, path )
  _assets.push( fileInfos )
  _assetsByPath.set(fileInfos.initialPath, fileInfos )
  _assetsByName.set(fileInfos.name, fileInfos )
  if( isTexture( fileInfos )){
    handleTexture( fileInfos )
  }
}


function handleTexture(fileInfos: FileInfos) {
  const resId = fileInfos.group+'/'+fileInfos.name
  let tex = _textures.get( resId )
  if( !tex ){
    tex = new TextureAsset()
    _textures.set( resId, tex)
  }
  tex.addSource( fileInfos )
}



// const _textures




function getAssetInfos( filenameOrName: string ): FileInfos {
  let res = _assetsByPath.get(filenameOrName)
  if ( !res ) {
    res = _assetsByName.get(filenameOrName)
    if ( !res ) {
      console.error(`can't find asset ${filenameOrName}`);
    }
  }
  return res
}

function getAssetPath( filename: string): string {
  return getAssetInfos(filename).path
}

function getAssets(): FileInfos[] {
  return _assets.concat()
}

function getTexture( filename: string, gl:GLContext, options?: Partial<ITextureOptions> ): TextureResource {
  const infos = getAssetInfos(filename)
  const res = _textures.get(infos.group+'/'+infos.name)
  if ( !res ) {
    console.error(`can't find texture ${filename}`);
  }
  const tr = new TextureResource( res, {gl}, options )

  /// #if DEBUG
  res._resources.push(tr)
  /// #endif

  return tr
}

const WebglAssets = {
  getAssets,
  getAssetPath,
  getTexture
}

export default WebglAssets;


const deps:string[] = []

_files.keys().forEach( k=>{
  deps.push( k )
  handleFile( k, _files(k).default )
})

// console.log(_assetsByName);
// console.log( Array.from(_assetsByName.values()).map(i=>i.initialPath) )



// =============================================================================
//                  ==============  HMR  ================
// =============================================================================

/// #if DEBUG

const _texToReload = new Set<TextureResource>()
let _texReloadTimeout:number
function scheduleTextureReload(r:TextureResource[]){
  r.forEach(t=>_texToReload.add(t))
  clearTimeout(_texReloadTimeout)
  _texReloadTimeout = setTimeout( ()=>{
    _texToReload.forEach( t=>t.doLoad() )
    _texToReload.clear()
  }, 500 )
}

function handleTextureUpdate(asset: TextureAsset, fileInfos: FileInfos) {
  //const codec = getTextureCodec( fileInfos )
  // reload only jpg
  const codec = 'std'//getTextureCodec( fileInfos )
  const source = asset.sources.find( s=>s.codec === codec)
  source.lods[0].files[0] = fileInfos.path
  scheduleTextureReload( asset._resources )
}


function handleFileUpdate( initialPath:string, path:string ){
  const fileInfos = parsePath( initialPath, path )
  if( ! _assetsByPath.has(fileInfos.initialPath) ){
    console.error( "asset update on non existing asset ", fileInfos.initialPath )
  }
  if( _assetsByPath.get(fileInfos.initialPath).path !== fileInfos.path ){
    console.log( "asset "+fileInfos.initialPath+" has changed");
    if( isTexture( fileInfos )){
      handleTextureUpdate(  _textures.get(fileInfos.group+'/'+fileInfos.name), fileInfos )
    }
  }
}



if( module.hot ){
  
  module.hot.accept( [_contextId],
    ()=>{ 
      const reloadedFiles = getFileContext()
      reloadedFiles.keys().forEach( k=>{
        handleFileUpdate( k,reloadedFiles(k).default );
      })
    }
  );
}

  /// #endif