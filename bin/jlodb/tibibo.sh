#!/bin/bash

# CHECK ARGUMENTS
if [ ! -f "index.html" ]; then
    echo `basename $0` must be run from the jlodb folder root
    exit 1
fi

# PARAMETER DEFAULT VALUES
book=""
folder="book"
type="web"
tmp=".tmp"
noclean=""

OPTIND=1

while getopts "h?b:f:kt:" opt; do
    case "$opt" in
    h|\?)
        echo "usage: $0 -b book_path [OPTIONS]"
        echo "  -c [INT]    : chapter id                   []"
        echo "  -f [NAME]   : output folder                [book]"
        echo "  -t [STRING] : export type                  [web]"
        exit 0
        ;;
    b)  book=$OPTARG ;;
    f)  folder=$OPTARG ;;
    k)  noclean="1" ;;
    t)  type=$OPTARG ;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

# CHECK BOOK
if [ -z $book ] ; then echo "No book"; exit 0; fi
if [ ! -d $book ] ; then echo "Can not find $book folder"; exit 0; fi
if [ ! -f "$book/content.ini" ] ; then echo "Can not find $book/content.ini file"; exit 0; fi

# CLEAN AND PREPARE
content="$folder"
if [ -z $noclean ] ; then
    if [ -d $folder ] ; then echo "+ Clean $folder"; rm -rf $folder/*
                        else echo "+ Create $folder"; mkdir $folder
    fi
    if [ -d $tmp ] ; then rm -rf $tmp; fi
    mkdir $tmp

    if [ "$type" = "epub" ] ; then
        echo "+ Building epub structure"
        mkdir $folder/OEBPS $folder/META-INF
        cp bin/jlodb/asset/container.xml $folder/META-INF
        cp bin/jlodb/asset/mimetype $folder
        content="$folder/OEBPS"
    fi
    echo "+ Copying data"
    mkdir -p $content/css $content/js $content/res/img $content/data
    cp bin/jlodb/asset/page.js $content/js
    cp bin/jlodb/asset/style.css $content/css
    cp -r res/img/default $content/res/img/
    cp -r js/* $content/js/
    cp -f css/jlodb.css $content/css/
    chmod 755 $folder
else
    if [ "$type" = "epub" ] ; then content="$folder/OEBPS"; fi
fi


for l in `cat $book/content.ini`; do

val=`echo $l | sed -e "s|.*=\(.*\)|\1|g"`
case "$l" in
"["*)
    pageid=`echo $l | sed -e "s|\[\(.*\)\]|\1|g"`
    echo "+ Create new page #$pageid"
    next=""; prev=""; menu=""
    ;;
"next"*) next="$val"; echo "  - next page is $next" ;;
"prev"*) prev="$val"; echo "  - prev page is $prev" ;;
"menu"*) menu="$val"; echo "  - menu page is $menu" ;;
"content"*)
    if [ `echo $val | tr -cd '|' | wc -c` -eq 0 ]; then
        cl=$val
        echo "  - page [$cl] no exercice"
    else
        cl=`echo $val | sed -e "s:\([^|]*\)|.*|.*|.*:\1:g"`
        cu=`echo $val | sed -e "s:.*|\([^|]*\)|.*|.*:\1:g"`
        cb=`echo $val | sed -e "s:.*|.*|\([^|]*\)|.*:\1:g"`
        ci=`echo $val | sed -e "s:.*|.*|.*|\([^|]*\):\1:g"`
        
        cids=`./bin/jlodb/getids.sh -b $cb -u $cu -o "$cb.json" -c $ci -f $tmp -q`
        
        echo "  - page [$cl] exercices: $cids"
    
        if [ ! -d $content/data/$cl ] ; then mkdir -p "$content/data/$cl" ; fi
        echo $cids > $content/data/$cl/content_$pageid.json
        ./bin/jlodb/getjson.sh -u $cu -i $cids -q > $content/data/$cl/exercices_$pageid.json
        
        if [ ! -f $content/data/$cl/activities.json ] ; then
            echo "  - import activities.json"
            touch $content/data/$cl/activities.json
        fi
    fi

;;
"type"*)

    if [ ! -f "$content/page_$pageid.html" ] ; then
        cat ./bin/jlodb/asset/template/$val.html | sed -e "s|%pageid%|$pageid|g" > "$content/page_$pageid.html"
    fi
    
    if [ -f $book/data/$cl/$pageid.html ] ; then
        if [ ! -d $content/data/$cl ] ; then mkdir -p "$content/data/$cl" ; fi
        echo "  - copy $book/data/$cl/$pageid.html as $content/data/$cl/content_$pageid.html"
        cp $book/data/$cl/$pageid.html $content/data/$cl/content_$pageid.html
    else
        echo "  - WARNING: unable to find $book/data/$cl/$pageid.html"
        echo "No content" > $content/data/$cl/content_$pageid.html
    fi
;;
esac

done

