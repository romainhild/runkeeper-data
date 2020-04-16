#!/bin/bash

rm *html
rm *js
rm *php

wget $1
unzip -o *.zip -d runkeeper-data
rm *.zip
source ~/miniconda3/etc/profile.d/conda.sh
conda activate jupyter
python stats-runkeeper.py

d=`date +%F`
mv runkeeper-data/cardioActivities.csv runkeeper-data/cardioActivities-$d.csv
sed -e 's/\.html/-'$d'.html/g' index.php_tpl > index.php
sed -i -e 's/script.js/script-'$d'.js/g' index.php
for i in *.html
do
    mv $i ${i/.html/-`date +%F`.html}
done
sed -e 's/cardioActivities.csv/cardioActivities-'$d'.csv/' script.js_tpl > script-$d.js