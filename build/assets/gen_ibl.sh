#! /bin/sh

alias cmft=$cmftExe
alias hdr2png=$hdr2pngExe



# genIbl path/to/exr/file.exr outname
# ================================== 
genIbl(){

  local HDR_SRCPATH=$1
  local OUTDIR=$2

  # basename "$HDR_SRCPATH"
  f="$(basename -- $HDR_SRCPATH)"
  echo "$f"

  local NAME="${f%.*}"

  echo "generating IBL for $HDR_SRCPATH, name: $NAME"


  $cmgen -s 1024 --ibl-samples 256 --ibl-min-lod-size 8 --type splitocta --format rgbm --ibl-ld $TMPDIR $HDR_SRCPATH
  for filename in $TMPDIR/$NAME/*.rgbm; do mv "$filename" "${filename}.png"; done;
  mogrify -resize 512x256! $TMPDIR/$NAME/*.png
  montage $TMPDIR/$NAME/m[0-7].rgbm.png -tile 1x8 -geometry 512x256+0+0 -background none $TMPDIR/$NAME/octa.rgbm.png
  rm $TMPDIR/$NAME/m*.rgbm.png

  $cmgen --format rgbm --sh-shader --sh-output $TMPDIR/$NAME/sh.txt --ibl-ld $TMPDIR $HDR_SRCPATH
  for filename in $TMPDIR/$NAME/m*.rgbm; do mv "$filename" "${filename}.png"; done;

  magick $TMPDIR/$NAME/*.rgbm.png -set filename:fn "%t" -format webp -quality 90 -define webp:lossless=false -define webp:alpha-compression=1 -define webp:alpha-quality=100 +adjoin "webp:$TMPDIR/$NAME/%[filename:fn].png.webp"

  mkdir $OUTDIR
  mv $TMPDIR/$NAME/* $OUTDIR

}


echo "done"
