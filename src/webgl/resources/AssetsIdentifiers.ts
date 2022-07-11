
export type TextureName = 
  "avatar" | 
  "env" | 
  "lightmap_hdr" | 
  "matcap_clay" | 
  "matcap_red_plastic" | 
  "matcap_white" | 
  "negx" | 
  "negy" | 
  "negz" | 
  "posx" | 
  "posy" | 
  "posz" | 
  "Suzanne_BaseColor" | 
  "Suzanne_MetallicRoughness" | 
  "texture1" | 
  "texture2"
;


export type TexturePath = 
  "gltfs/suzanne/Suzanne_BaseColor.png" | 
  "gltfs/suzanne/Suzanne_MetallicRoughness.png" | 
  "ibl/Helipad/env.png" | 
  "sample/avatar_LOD0.png" | 
  "sample/avatar_LOD1.png" | 
  "sample/avatar_LOD2.png" | 
  "sample/cube_car/negx.jpg" | 
  "sample/cube_car/negy.jpg" | 
  "sample/cube_car/negz.jpg" | 
  "sample/cube_car/posx.jpg" | 
  "sample/cube_car/posy.jpg" | 
  "sample/cube_car/posz.jpg" | 
  "sample/matcap_clay.jpg" | 
  "sample/matcap_clay.jpg.basis.ktx2" | 
  "sample/matcap_red_plastic.jpg" | 
  "sample/matcap_white.jpg" | 
  "sample/texture1.jpg" | 
  "sample/texture1.jpg.astc.ktx" | 
  "sample/texture1.jpg.dxt.ktx" | 
  "sample/texture1.jpg.etc.ktx" | 
  "sample/texture1.jpg.pvr.ktx" | 
  "sample/texture1.jpg.webp" | 
  "sample/texture2.jpg" | 
  "samples/room/env/env.png" | 
  "samples/room/lightmap_hdr.png" | 
  "samples/room/lightmap_hdr.png.webp"
;


export type OtherAssetName = 
  "room" | 
  "sh" | 
  "Suzanne" | 
  "tex"
;


export type OtherAssetPath = 
  "gltfs/suzanne/Suzanne.bin" | 
  "gltfs/suzanne/Suzanne.gltf" | 
  "ibl/Helipad/sh.bin" | 
  "sample/cube_car/tex.etc.ktx" | 
  "samples/room/env/sh.bin" | 
  "samples/room/room.glb"
;


export type AssetName = TextureName | OtherAssetName;
export type AssetPath = TexturePath | OtherAssetPath;
