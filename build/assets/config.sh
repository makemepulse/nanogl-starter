
TMPDIR=./tmp
BLIB=./build/assets

pvrcompres=/Applications/Imagination/PVRTexTool/CLI/OSX_x86/PVRTexToolCLI
cmgen=/Users/plepers/work/workspaces/c/filament/out/cmake-release/tools/cmgen/cmgen
astccompress=astcenc
FBX2glTF=$BLIB/bin/FBX2glTF
gltfOptim=$BLIB/gltf-optim-cli
hdr2pngExe=$BLIB/bin/hdr2png

EXPORT_BBC=true

TEX_FMT_PVR=true
TEX_FMT_ETC=true
TEX_FMT_ASTC=true
TEX_FMT_DXT=true




# ============= FAST

# PVRQUALITY=pvrtcfastest
# ETCQUALITY=etcfast

# ============= PROD

# PVRQUALITY=pvrtchigh
PVRQUALITY=pvrtcbest
ETCQUALITY=etcslow
ASTCQUALITY=astcthorough

# ============= SUPER HI

# PVRQUALITY=pvrtcbest
# ETCQUALITY=etcslowperceptual

