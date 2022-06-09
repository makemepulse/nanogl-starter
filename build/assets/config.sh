
TMPDIR=./tmp
BLIB=./build/assets

pvrcompres=/Applications/Imagination/PVRTexTool/CLI/OSX_x86/PVRTexToolCLI
astccompress=astcenc
FBX2glTF=$BLIB/bin/FBX2glTF
# FBX2glTF=/Users/plepers/work/workspaces/c/FBX2glTF/xcode/Debug/FBX2glTF 
# FBX2glTF=FBX2glTF

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





# export CUDA_HOME=/Developer/NVIDIA/CUDA-7.5
# export DYLD_LIBRARY_PATH=$CUDA_HOME/lib:$DYLD_LIBRARY_PATH