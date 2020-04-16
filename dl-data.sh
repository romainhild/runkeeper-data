#!/bin/bash

wget $1
unzip -o *.zip -d runkeeper-data
rm *.zip
source ~/miniconda3/etc/profile.d/conda.sh
conda activate jupyter
python stats-runkeeper.py
