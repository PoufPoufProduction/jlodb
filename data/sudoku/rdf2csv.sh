#!/bin/sh

if [ "$#" -ne 1 ] || ! [ -f "$1" ]; then
  echo "Usage: $0 file.rdf" >&2
  exit 1
fi

rm -f tmp.txt

for line in `grep -e title -e description $1`;do
    printf $line | sed -e "s/\/dct:description>/\/dct:description>\n/g" >> tmp.txt
done

cat tmp.txt | sed -e 's/<dct:titlexml:lang="fr-FR">\([0-9][0-9]\).*symétrie\(.\).*"level":\(.\),"data":"\([1-9a-i]\{81\}\).*/\1;\2;\3;\4/g'

rm tmp.txt


