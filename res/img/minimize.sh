#!/bin/sh

cat $1 \
 | tr -d '\n' \
 | sed -e 's|<metadata.*/metadata>||g' \
 | sed -e 's|>|>\n|g' \
 | sed -e 's|[ ]*<|<|g' \
 | grep -v '<sodipodi:' \
 | sed -e 's|xmlns:sodipodi="[^"]*"||g' \
 | sed -e 's|xmlns:inkscape="[^"]*"||g' \
 | sed -e 's|sodipodi:[^=]*="[^"]*"||g' \
 | sed -e 's|inkscape:[^=]*="[^"]*"||g' \
 | sed -e 's|\.\([0-9]\{3\}\)[0-9]*|\.\1|g' \
 | sed -e 's|display:inline||g' \
 | sed -e 's|overflow:visible||g' \
 | sed -e 's|visibility:visible||g' \
 | sed -e 's|fill-opacity:1||g' \
 | sed -e 's|stroke-miterlimit:4||g' \
 | sed -e 's|stroke-dasharray:none||g' \
 | sed -e 's|stroke-dashoffset:0||g' \
 | sed -e 's|stroke-opacity:1||g' \
 | sed -e 's|;marker[^:]*:[^;]*|;|g' \
 | sed -e 's|;solid[^:]*:[^;]*|;|g' \
 | sed -e 's|;enable-background:accumulate|;|g' \
 | sed -e 's|;stroke-opacity:1|;|g' \
 | sed -e 's|;color:#000000|;|g' \
 | sed -e 's|;clip-rule:nonzero|;|g' \
 | sed -e 's|;opacity:1|;|g' \
 | sed -e 's|;mix-blend-mode:normal|;|g' \
 | sed -e 's|;color-interpolation:sRGB|;|g' \
 | sed -e 's|;color-interpolation-filters:linearRGB|;|g' \
 | sed -e 's|;filter-gaussianBlur-deviation:0|;|g' \
 | sed -e 's|;[^:]*:normal|;|g' \
 | sed -e 's|;[^:]*:auto|;|g' \
 | sed -e 's|;[;]*|;|g'  \
 | sed -e 's|";|"|g'  \
 | sed -e 's|id="[^"]*"||g'  \
 | sed -e 's|0\.499|0\.5|g'  \
 | sed -e 's| [ ]*| |g'
 
 