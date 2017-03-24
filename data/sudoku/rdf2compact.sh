#!/bin/sh

if [ "$#" -ne 1 ] || ! [ -f "$1" ]; then
  echo "Usage: $0 file.rdf" >&2
  exit 1
fi


for line in `grep description $1`;do
	echo % sudoku
	echo $line | sed -e 's/.*data":"\(.*\)".*/\1/g' -e 's/[abcdefghi]/\./g'
done


