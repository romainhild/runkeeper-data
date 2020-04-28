#!/bin/bash

if [ $# -eq 1 ]
then
    wget $1
    unzip -o *.zip -d runkeeper-data-export
    sed -i '' -e '1r runkeeper-data-export/cardioActivities.csv' -e '2,$!d' runkeeper-data/cardioActivities.csv
    mv runkeeper-data-export/*.gpx runkeeper-data/
    rm -rf *.zip runkeeper-data-export
fi
# folder where anacondo is installed with the jupyter env
# source ~/miniconda3/etc/profile.d/conda.sh
source ~/Documents/anaconda3/etc/profile.d/conda.sh
conda activate jupyter
python app.py
