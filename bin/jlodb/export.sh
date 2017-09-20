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
title="jlodb local web site"
save="cookie"

OPTIND=1

while getopts "h?b:f:i:ks:t:" opt; do
    case "$opt" in
    h|\?)
        echo "usage: $0 -b book_path [OPTIONS]"
        echo "  -f [NAME]   : output folder                [book]"
        echo "  -i [STRING] : title name                   [...]"
        echo "  -k          : keep existing data           []"
        echo "  -s          : save mode (cookie|local)     [cookie]"
        echo "  -t [STRING] : export type (epub|web)       [web]"
        exit 0
        ;;
    b)  book=$OPTARG ;;
    f)  folder=$OPTARG ;;
    i)  title=$OPTARG ;;
    k)  noclean="1" ;;
    s)  save=$OPTARG ;;
    t)  type=$OPTARG ;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

IFS=$'\n'

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
    cp -rf $book/asset/* $content/
    
    assets=( ext/noto/svg/emoji_u1f1eb_1f1f7.svg ext/noto/svg/emoji_u1f42d.svg ext/noto/svg/emoji_u1f42e.svg ext/noto/svg/emoji_u1f42f.svg ext/noto/svg/emoji_u1f43a.svg ext/noto/svg/emoji_u1f43b.svg ext/noto/svg/emoji_u1f43c.svg ext/noto/svg/emoji_u1f435.svg ext/noto/svg/emoji_u1f437.svg )
    for a in "${assets[@]}"; do
        f="$a"
        d=`dirname $f`
        if [ ! -d $content/$d ] ; then echo "  - build $content/$d" ; mkdir -p $content/$d ; fi
        cp -r $f $content/$f
    done
    
    chmod 755 $folder
else
    if [ "$type" = "epub" ] ; then content="$folder/OEBPS"; fi
fi

if [ -d $tmp ] ; then rm -rf $tmp; fi
mkdir $tmp
tmpfile=$tmp/tmp


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
"lang"*)
    echo "  - langs are $val"
;;
"content"*)
    if [ `echo $val | tr -cd '|' | wc -c` -eq 0 ]; then
        cl=$val
        echo "  - page [$cl] no exercice"
    else
        cl=`echo $val | sed -e "s:\([^|]*\)|.*|.*|.*|.*:\1:g"`
        cu=`echo $val | sed -e "s:.*|\([^|]*\)|.*|.*|.*:\1:g"`
        cf=`echo $val | sed -e "s:.*|.*|\([^|]*\)|.*|.*:\1:g"`
        cb=`echo $val | sed -e "s:.*|.*|.*|\([^|]*\)|.*:\1:g"`
        ci=`echo $val | sed -e "s:.*|.*|.*|.*|\([^|]*\):\1:g"`
        
        cids=`./bin/jlodb/getids.sh -i $cb -u $cu -o "$cb.json" -c $ci -f $tmp -q -s $cf`
        
        acfile="$content/data/$cl/activities.json"
        if [ ! -f $acfile ] ; then
            echo "{" > $acfile
            wget "$cu/api/activity.php?locale" -O p_json.tmp
            echo -n "  + processing activities.json for $cl: "
            for a in `cat p_json.tmp | sed -e 's/{"id":/\n{"id":/g'` ; do
                if [ `echo $a | grep label | wc -l` -eq 1 ]; then
                    id=`echo $a | sed -e 's/^.*id":"\([^"]\+\).*$/\1/g'`
                    label=`echo $a | sed -e 's/^.*label":"\([^"]\+\).*$/\1/g'`
                    locale=`echo $a | sed -e 's/^.*locale":\(.\+}\)}.*$/\1/g'`
                    echo -n " $id"

                    # FILL FILE
                    echo "  \"${id}\":{\"label\":\"${label}\",\"locale\":${locale}}," >> $acfile
                fi
            done
            echo "  \"zzz\":{}" >> $acfile
            echo "}" >> $acfile
            echo
        fi
        
        echo "  - page [$cl] exercices: $cids"
    
        if [ ! -d $content/data/$cl ] ; then mkdir -p "$content/data/$cl" ; fi
        echo "[\"$cids\"]" | sed -e "s|,|\",\"|g" > $content/data/$cl/content_$pageid.json
        ./bin/jlodb/getjson.sh -u $cu -i $cids -q > $content/data/$cl/exercices_$pageid.json
        
        ./bin/jlodb/cpsrc.sh -u $cu -i $cids -f $content
    fi
    
    if [ ! -f $content/data/lang.json ] ; then
        echo "  - create $content/data/lang.json for $cl"
        echo "[\"$cl\"]" > $content/data/lang.json
    else
        if [ `cat $content/data/lang.json | grep $cl | wc -l` -eq 0 ] ; then
            echo "  - add $cl to $content/data/lang.json"
            echo " TODO"
        fi
    fi

;;
"type"*)

    htmlfile="$content/page_$pageid.html"
    if [ ! -f "$htmlfile" ] ; then
        cat ./bin/jlodb/asset/template/$val.html | sed -e "s|%pageid%|$pageid|g" -e "s|%title%|$title|g" > "$htmlfile"
        
        if [ "$save" = "cookie" ] ; then
            echo "  - persistence by cookies"
        else
            echo "  - persistence by localStorage"
            cat $htmlfile | grep -v "js/jquery.cookie.js" > $tmpfile; mv $tmpfile $htmlfile
        fi

        if [ -z $next ] ; then
            cat $htmlfile | grep -v "%next%" > $tmpfile; mv $tmpfile $htmlfile
        else
            cat $htmlfile | sed -e "s|%next%|page_${next}.html|g" > $tmpfile; mv $tmpfile $htmlfile
        fi
        
        if [ -z $prev ] ; then
            cat $htmlfile | grep -v "%prev%" > $tmpfile; mv $tmpfile $htmlfile
        else
            cat $htmlfile | sed -e "s|%prev%|page_${prev}.html|g" > $tmpfile; mv $tmpfile $htmlfile
        fi
        
        if [ -z $menu ] ; then
            cat $htmlfile | grep -v "%menu%" > $tmpfile; mv $tmpfile $htmlfile
        else
            cat $htmlfile | sed -e "s|%menu%|page_${menu}.html|g" > $tmpfile; mv $tmpfile $htmlfile
        fi
    fi
    
    if [ -f $book/data/$cl/content_$pageid.html ] ; then
        if [ ! -d $content/data/$cl ] ; then mkdir -p "$content/data/$cl" ; fi
        echo "  - copy $book/data/$cl/content_$pageid.html as $content/data/$cl/content_$pageid.html"
        cp $book/data/$cl/content_$pageid.html $content/data/$cl/content_$pageid.html
    else
        echo "  - WARNING: unable to find $book/data/$cl/content_$pageid.html"
        echo "No content" > $content/data/$cl/content_$pageid.html
    fi
;;
esac

done

if [ -f "$content/page_0.html" ] ; then cp $content/page_0.html $content/index.html ; fi
