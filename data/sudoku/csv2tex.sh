#!/bin/sh

if [ "$#" -ne 1 ] || ! [ -f "$1" ]; then
  echo "Usage: $0 file.csv" >&2
  exit 1
fi

for l in `cat $1` ; do
echo "\\\begin{tikzpicture}[scale=1.7]"
echo " \\\begin{scope}"
echo "  \\\draw (0, 0) grid (9, 9);"
echo "  \\\draw[very thick, scale=3] (0, 0) grid (3, 3);"
echo "  \\\setcounter{row}{1}"
echo
echo $l | sed -e 's/.\{7\}\(.\{81\}\)/\1/g' -e 's/[abcdefghi]/ /g' -e 's/\(.\)/\{\1\}/g' -e 's/\(.\{27\}\)/  \\setrow \1\n/g'

echo " \\\end{scope}"
echo "\\\end{tikzpicture}"

echo "\\\newpage"
echo
echo

done


