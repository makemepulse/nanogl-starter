
#! /bin/sh


INPUT=$1
OUTDIR=$2
SIZE=$3
TMPDIR=./tmp

mkdir $OUTDIR

source ./assets/common.sh
  
  # --silent \

CFMT_BASE_ARGS="\
  --numCpuProcessingThreads 0 \
  --useOpenCL true \
  --deviceType gpu \
  --mipCount 0"

     # --filter radiance \
cmft --input $INPUT \
     $CFMT_BASE_ARGS \
     --lightingModel blinn \
     --glossScale 0 \
     --glossBias 16 \
     --outputNum 1 \
     --srcFaceSize $SIZE \
     --dstFaceSize $SIZE \
     --output0 $TMPDIR/cube \
     --output0params tga,bgr8,facelist


mogrify -flip -flop $TMPDIR/cube_posy.tga
mogrify -flip -flop $TMPDIR/cube_negy.tga


PVRTexToolCLI -cube -legacypvr -q pvrtcbest -f PVRTC1_2_RGB,UBN,lRGB -o $OUTDIR/tex.pvr -i \
$TMPDIR/cube_negx.tga,\
$TMPDIR/cube_posy.tga,\
$TMPDIR/cube_negz.tga,\
$TMPDIR/cube_posx.tga,\
$TMPDIR/cube_negy.tga,\
$TMPDIR/cube_posz.tga \


PVRTexToolCLI -cube -q $ETCQUALITY -f ETC1,UBN,lRGB -o $OUTDIR/tex.ktx -i \
$TMPDIR/cube_negx.tga,\
$TMPDIR/cube_posy.tga,\
$TMPDIR/cube_negz.tga,\
$TMPDIR/cube_posx.tga,\
$TMPDIR/cube_negy.tga,\
$TMPDIR/cube_posz.tga \

convert $TMPDIR/cube_negx.tga $OUTDIR/negx.jpg
convert $TMPDIR/cube_negy.tga $OUTDIR/posy.jpg
convert $TMPDIR/cube_negz.tga $OUTDIR/negz.jpg
convert $TMPDIR/cube_posx.tga $OUTDIR/posx.jpg
convert $TMPDIR/cube_posy.tga $OUTDIR/negy.jpg
convert $TMPDIR/cube_posz.tga $OUTDIR/posz.jpg


nvassemble -cube \
  $TMPDIR/cube_negx.tga \
  $TMPDIR/cube_posy.tga \
  $TMPDIR/cube_negz.tga \
  $TMPDIR/cube_posx.tga \
  $TMPDIR/cube_negy.tga \
  $TMPDIR/cube_posz.tga \
  -o $OUTDIR/tex.jpg.dds



rm -rf $TMPDIR/cube_*.tga

nvcompress -nomips -bc1 $OUTDIR/tex.jpg.dds $OUTDIR/tex.dds
rm -rf $OUTDIR/tex.jpg.dds
