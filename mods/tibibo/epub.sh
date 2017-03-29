#!/bin/bash

dest=output

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
#iconv -f "windows-1252" -t "UTF-8" $file > tmp.json
#mv -f tmp.json $file

# BUILD FOLDER
#if [ -d $dest ]; then
#    rm -rf $dest/*
#else
#    mkdir $dest
#fi
# mkdir $dest/conf
# cp conf/jlodb.ini $dest/conf
# cp -r js $dest/

IFS=$'\n'
page=1
for line in `cat $file | sed -e "s/{/\n/g"` ; do
    value=`echo $line | sed -e 's/^.*label":"//g' -e 's/","description.*$//g'`
    label=`echo $line | sed -e 's/^.*description":"//g' -e 's/","children.*$//g' -e 's/\[//g'`
    
    if [ ! -z $label ]; then
    
        if [ $page -lt 10 ]; then p=00$page; else if [ $page -lt 100 ]; then p=0$page; else p=$page; fi; fi
        cp mods/tibibo/epub/page_header.xhtml $dest/page_$p.xhtml
        for activity in data/* ; do
            echo "<!--  <script type=\"text/javascript\" src=\"activities/"`basename $activity`"/"`basename $activity`".js\"></script> -->" >> $dest/page_$p.xhtml
        done
        for activity in data/* ; do
            echo "<!--  <link type=\"text/css\" rel=\"stylesheet\" href=\"activities/"`basename $activity`"/style.css\" media=\"all\"/> -->" >> $dest/page_$p.xhtml
        done
            
        # wget "$1/api/exercice.php?detail&source&id=$label" -O tmp.json
        for ex in `cat tmp.json | sed -e 's/{"id":/\n{"id":/g'` ; do
            activity=`echo $ex | sed -e 's/^.*activity":"\([^"]\+\).*$/\1/g'`

            
            
        done
        
        exit 1
    fi
done

