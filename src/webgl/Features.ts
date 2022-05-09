import Program from "nanogl/program";
import Gltf from "nanogl-gltf/lib/Gltf";
import KHR_texture_transform from "nanogl-gltf/lib/extensions/EXT_texture_webp";
import KHR_lights_punctual from "nanogl-gltf/lib/extensions/KHR_lights_punctual";
import KHR_materials_pbrSpecularGlossiness from "nanogl-gltf/lib/extensions/KHR_materials_pbrSpecularGlossiness";
import KHR_materials_unlit from "nanogl-gltf/lib/extensions/KHR_materials_unlit";
import { TextureCodecs } from "./resources/TextureCodec";
import { TextureCodecDxt, TextureCodecEtc, TextureCodecPvr } from "./resources/TextureCodecBBC";
import TextureCodecStd, { TextureCodecWebp } from "./resources/TextureCodecStd";
import './dev/console';

//==============================
// code here is called before GLApp is defined
//==============================


/// #if DEBUG
Program.debug = true;
/// #else
Program.debug = false;
/// #endif

TextureCodecs.registerCodec( new TextureCodecStd() );
TextureCodecs.registerCodec( new TextureCodecWebp() );
TextureCodecs.registerCodec( new TextureCodecDxt() );
TextureCodecs.registerCodec( new TextureCodecEtc() );
TextureCodecs.registerCodec( new TextureCodecPvr() );



Gltf.addExtension(new KHR_texture_transform());
Gltf.addExtension(new KHR_lights_punctual());
Gltf.addExtension(new KHR_materials_unlit());
Gltf.addExtension(new KHR_materials_pbrSpecularGlossiness());
