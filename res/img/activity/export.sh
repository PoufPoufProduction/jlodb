#!/bin/bash

name=`basename $1 .svg`
inkscape $1 -e icon/"$name"144.png -d 72 -w 144 -h 144
inkscape $1 -e icon/"$name"128.png -d 72 -w 128 -h 128
inkscape $1 -e icon/"$name"114.png -d 72 -w 114 -h 114
inkscape $1 -e icon/"$name"72.png -d 72 -w 72 -h 72
inkscape $1 -e icon/"$name"48.png -d 72 -w 48 -h 48
inkscape $1 -e icon/"$name"16.png -d 72 -w 16 -h 16
