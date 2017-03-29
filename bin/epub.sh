#!/bin/bash

if [ ! -f "index.html" ]; then
    echo `basename $0` must be run from the jlodb folder root
    exit 1
fi

if [ "$#" -lt 2 ]; then
    echo "usage : `basename $0` host [json file|tibibo id]"
    exit 1
fi

# GET JSON FILE
file=""
if [ -f $2 ]; then file=$2
else if [ -f "$2.json" ]; then file="$2.json"
else
    echo "get book from website"
fi
fi
iconv -f "windows-1252" -t "UTF-8" $file > tmp.json
mv -f tmp.json $file

IFS=$'\n'
for line in `cat $file | sed -e "s/{/\n/g"` ; do
    value=`echo $line | sed -e 's/^.*label":"//g' -e 's/","description.*$//g'`
    label=`echo $line | sed -e 's/^.*description":"//g' -e 's/","children.*$//g' -e 's/\[//g'`
    
    if [ ! -z $label ]; then
        wget "$1/api/exercice.php?detail&source&id=$label" -O tmp.json
    fi
done

