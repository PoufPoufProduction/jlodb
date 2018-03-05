#!/bin/sh
for f in *.svg; do

~/Depot/SVG-Inventory-Icons/reduce.sh $f
echo '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' > tmp.svg
echo '<!-- Created with Inkscape (http://www.inkscape.org/) -->' >> tmp.svg
echo '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" width="100%" height="100%" viewBox="0 0 48 48">' >> tmp.svg
echo '<defs/>' >> tmp.svg
grep path $f >> tmp.svg
echo '</svg>' >> tmp.svg
mv tmp.svg $f
done

