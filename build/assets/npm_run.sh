#! /bin/sh

FOLDER=$1
GLOB=$2

SCRIPT_PATH="./assets/$FOLDER/build.sh"
if [ -e $SCRIPT_PATH ]
then
  $SCRIPT_PATH $GLOB
else
  echo FAIL : \"./src/assets/webgl/$FOLDER/build.sh\" doesn\'t exist
  exit
fi 

