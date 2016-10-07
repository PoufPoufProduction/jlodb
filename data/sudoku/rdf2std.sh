#!/bin/sh

if [ "$#" -ne 1 ] || ! [ -f "$1" ]; then
  echo "Usage: $0 file.rdf" >&2
  exit 1
fi

for line in `grep description $1`;do
	echo % sudoku
	echo $line | sed -e 's/.*data":"\(.*\)".*/\1/g' -e 's/[abcdefghi]/\./g' -e 's/\(.\{3\}\)\(.\{3\}\)\(.\{3\}\)/ \1 | \2 | \3\n/g' -e 's/\([\.1-9]\)\([\.1-9]\)\([\.1-9]\)/\1 \2 \3/g' -e 's/\(.\{69\}\)/\1-------+-------+-------\n/g' | head --lines 11
done


