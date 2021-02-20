#!/bin/bash

if [ $# -eq 1 ]; then
    wget $1
    if [[ -d runkeeper-data && -f runkeeper-data/cardioActivities.csv ]]; then
        unzip -o *.zip -d runkeeper-data-export
        sed -i '' -e '1r runkeeper-data-export/cardioActivities.csv' -e '2,$!d' runkeeper-data/cardioActivities.csv
        mv runkeeper-data-export/*.gpx runkeeper-data/
        rm -rf *.zip runkeeper-data-export
    else
        unzip -o *.zip -d runkeeper-data
        rm -rf *.zip
    fi
fi
# folder where anacondo is installed with the jupyter env
source ${CONDA_EXE%/*}/../etc/profile.d/conda.sh
conda activate runkeeper
python app.py
