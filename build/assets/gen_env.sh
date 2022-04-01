#! /bin/sh
# INPUT="Ditch-River_2k.hdr"
# INPUT="DH035LL.hdr"
INPUT=$1
OUTDIR=$2
EXPO=$3
# INPUT="rgb_dir_test.hdr"

mkdir $OUTDIR

CFMT_BASE_ARGS="\
  --numCpuProcessingThreads 0 \
  --useOpenCL true \
  --deviceType gpu \
  --silent \
  --mipCount 0"



# getGloss(){
#   ANGLE=$1
#   RES=$( bc -l <<< "l( l( 0.00001 ) / l( c( $ANGLE/180.0*3.14159265 ) ) ) / l(2)" )
#   echo "$RES"
# }

genHd(){
  cmft \
    $CFMT_BASE_ARGS \
    --input $INPUT \
    --srcFaceSize 256 \
    --dstFaceSize 256 \
    --outputNum 1 \
    --output0 $OUTDIR/env_hi \
    --output0params hdr,rgbe,octsplit

  hdr2png -i $OUTDIR/env_hi.hdr -o $OUTDIR/env_hi.png -e $EXPO
  printf "."
}

genBaseLevel(){
  cmft \
    $CFMT_BASE_ARGS \
    --input $INPUT \
    --srcFaceSize 256 \
    --dstFaceSize 128 \
    --outputNum 1 \
    --output0 $OUTDIR/level0 \
    --output0params hdr,rgbe,octsplit

  hdr2png -i $OUTDIR/level0.hdr -o $OUTDIR/level0.png -e $EXPO
  printf "."
}

genGlossLevel(){

  LVL=$1
  # ANGLE=$( bc <<< "10 + 80/7 * $LVL" )
  # GLOSS=$( getGloss $ANGLE )
  GLOSS=$2
  OUTNAME=$OUTDIR/level$LVL


  cmft \
    $CFMT_BASE_ARGS \
    --input $INPUT \
    --filter radiance \
    --lightingModel blinn \
    --glossScale 0 \
    --glossBias $GLOSS \
    --srcFaceSize 128 \
    --dstFaceSize 128 \
    --outputNum 1 \
    --output0 $OUTNAME \
    --output0params hdr,rgbe,octsplit

  hdr2png -i $OUTNAME.hdr -o $OUTNAME.png -e $EXPO
  printf "."
}


genBackground(){

  LVL=$1
  # ANGLE=$( bc <<< "10 + 80/7 * $LVL" )
  # GLOSS=$( getGloss $ANGLE )
  GLOSS=$2
  OUTNAME=$OUTDIR/bg


  cmft \
    $CFMT_BASE_ARGS \
    --input $INPUT \
    --filter radiance \
    --lightingModel blinn \
    --glossScale 0 \
    --glossBias $GLOSS \
    --srcFaceSize 128 \
    --dstFaceSize 128 \
    --outputNum 1 \
    --output0 $OUTNAME \
    --output0params hdr,rgbe,octsplit

  convert -gamma 2.7 -brightness-contrast -20x0 $OUTNAME.hdr $OUTNAME.jpg
  # hdr2png -i $OUTNAME.hdr -o $OUTNAME.png -e $EXPO
  printf "."
}


genSH(){
  cmft \
    $CFMT_BASE_ARGS \
    --input $INPUT \
    --filter shcoeffs \
    --outputNum 1 \
    --output0 $OUTDIR/sh \

  ./build/assets/sh2bin -o $OUTDIR/sh.bin -e $EXPO $OUTDIR/sh.js
  rm $OUTDIR/sh.js

}


genHd
genBaseLevel
genGlossLevel 1 11.038118968108332
genGlossLevel 2 8.815820067985793
genGlossLevel 3 7.36788005985188
genGlossLevel 4 6.194328423796595
genGlossLevel 5 5.103120139257955
genGlossLevel 6 3.9191797055252344
genGlossLevel 7 1.9662123463476706
genSH


genBackground 2 8.815820067985793


montage $OUTDIR/level[0-7].png -tile x8 -geometry 512x256 -background none $OUTDIR/env.png


rm $OUTDIR/level*.png
rm $OUTDIR/*.hdr




echo "done"
