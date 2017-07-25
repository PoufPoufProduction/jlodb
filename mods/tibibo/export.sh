#!/bin/bash

# CHECK ARGUMENTS
if [ ! -f "index.html" ]; then
    echo `basename $0` must be run from the jlodb folder root
    exit 1
fi

# PARAMETER DEFAULT VALUES
add=0
book=""
dest="output"
feat="."
url="jlodb.poufpoufproduction.fr"
stat=0

OPTIND=1

while getopts "h?ab:d:o:su:" opt; do
    case "$opt" in
    h|\?)
        echo "usage: $0 -b book_id [OPTIONS]"
        echo "  -a          : add new langage to book      [false]"
        echo "  -d [PATH]   : static data path             [.]"
        echo "  -o [NAME]   : output folder                [output]"
        echo "  -u [URL]    : jlodb website url            [jlodb.poufpoufproduction.fr]"
        echo "  -s          : activity download is static  [false]"
        exit 0
        ;;
    a)  add=1 ;;
    b)  book=$OPTARG ;;
    d)  feat=$OPTARG ;;
    o)  dest=$OPTARG ;;
    s)  stat=1 ;;
    u)  url=$OPTARG ;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

# CHECK BOOK
if [ -z $book ] ; then
	echo no book
	exit 0
fi

uuid()
{
    local N B T

    for (( N=0; N < 16; ++N ))
    do
        B=$(( $RANDOM%255 ))

        if (( N == 6 ))
        then
            printf '4%x' $(( B%15 ))
        elif (( N == 8 ))
        then
            local C='89ab'
            printf '%c%x' ${C:$(( $RANDOM%${#C} )):1} $(( B%15 ))
        else
            printf '%02x' $B
        fi

        for T in 3 5 7 9
        do
            if (( T == N ))
            then
                printf '-'
                break
            fi
        done
    done

    echo
}
uid=`uuid`
IFS=$'\n'

# CLEANING STUFF
echo ----- CLEAN and INITIALIZE -----
rm -f p_*.tmp
if [ $add -eq 0 ] ; then echo "+ delete $dest"; rm -rf $dest; else echo "+ keep $dest"; fi

# GET LANG
echo ----- GET language -----
wget "$url/api/checkdb.php" -O p_json.tmp
lang=`cat p_json.tmp | grep lang | sed -e 's/.*lang":"\([^"]\+\)\+",.*/\1/g'`
echo "+ lang: ${lang}"

# BUILD FOLDER
echo ----- PREPARE folder $dest -----
mkdir -p $dest/OEBPS $dest/OEBPS/res/img/ $dest/OEBPS/css $dest/OEBPS/activities
mkdir -p $dest/OEBPS/data $dest/OEBPS/data/$lang
cp -r mods/tibibo/data/META-INF/ $dest/
cp -f mods/tibibo/data/mimetype $dest/
cp -r res/img/default $dest/OEBPS/res/img/
cp -r js $dest/OEBPS/
cp -f css/jlodb.css $dest/OEBPS/css/
cp -f mods/tibibo/data/style.css $dest/OEBPS/css/
cp -f mods/tibibo/data/page.js $dest/OEBPS/js/

# HANDLE lang.json
echo ----- HANDLE $dest/OEBPS/data/lang.json -----
if [ -f $dest/OEBPS/data/lang.json ] ; then
    if [ `cat $dest/OEBPS/data/lang.json | grep $lang | wc -l` -eq 0 ] ; then
        cat $dest/OEBPS/data/lang.json | sed -e "s/\]/,\"${lang}\"\]/g" >> p_tmp.tmp
        mv p_tmp.tmp $dest/OEBPS/data/lang.json
    fi
else
    echo "[\"${lang}\"]" > $dest/OEBPS/data/lang.json
fi

# if [ -d $feat ] ; then cp -r $feat $dest/OEBPS/data/ ; fi


# GET JSON FILE
echo ----- GET BOOK $book -----
file=""
if [ -f $book ]; then file=$book; echo "+ Get book from $file"
else if [ -f "$book.json" ]; then file="$book.json"; echo "+ Get book from ${file}"
else
    echo "+ Get book from website"
    file="p_$book.tmp"
    wget "$url/mods/tibibo/api/book.php?value=$book" -O p_json.tmp
    cat p_json.tmp | sed -e 's/^.*description":\[//g' -e 's/\],  "comment".*$//g' > $file
    rm -f p_json.tmp
fi
fi

if [ `file $file | grep "UTF-8" | wc -l` -eq 0 ]; then
    echo ----- CONVERT $file into UTF-8 -----
    iconv -f "windows-1252" -t "UTF-8" $file > tmp.tmp ; mv -f tmp.tmp $file
fi

# GET ACTIVITIES DATA (TO ENHANCE IN ORDER TO KEEP ONLY USED ACTIVITIES)
echo ----- GET activities information in $dest/OEBPS/data/$lang/activities.json -----
if [ ! -f $dest/OEBPS/data/$lang/activities.json ] ; then
    echo "{" > $dest/OEBPS/data/$lang/activities.json
    wget "$url/api/activity.php?locale" -O p_json.tmp
    echo -n "+ processing"
    for a in `cat p_json.tmp | sed -e 's/{"id":/\n{"id":/g'` ; do
        if [ `echo $a | grep label | wc -l` -eq 1 ]; then
            id=`echo $a | sed -e 's/^.*id":"\([^"]\+\).*$/\1/g'`
            label=`echo $a | sed -e 's/^.*label":"\([^"]\+\).*$/\1/g'`
            locale=`echo $a | sed -e 's/^.*locale":\(.\+}\)}.*$/\1/g'`
            echo -n " $id"

            # FILL FILE
            echo "  \"${id}\":{\"label\":\"${label}\",\"locale\":${locale}}," >> $dest/OEBPS/data/$lang/activities.json
        fi
    done
    echo "  \"zzz\":{}" >> $dest/OEBPS/data/$lang/activities.json
    echo "}" >> $dest/OEBPS/data/$lang/activities.json
    echo "... OK"
else
    echo "+ keep current file"
fi


#TOC.NCX
echo ----- BUILD TABLE OF CONTENT toc.ncx -----
sed -e "s/%uuid%/${uid}/g" mods/tibibo/data/toc.ncx > $dest/OEBPS/toc.ncx

page=1
for line in `cat $file | sed -e "s/{/\n/g"` ; do
if [ ! `echo $line | grep "[^ ]" | wc -l` -eq 0 ] ; then

    value=`echo $line | sed -e 's/^.*label":"\([^"]\+\).*$/\1/g'`
    label=`echo $line | sed -e 's/^.*description":"//g' -e 's/","children.*$//g' -e 's/\[//g'`
    idpage=`echo $line | sed -e 's/^"id":\([0-9]\+\).*$/\1/g'`

    
    if [ ! -z $label ]; then
 
        if [ $page -lt 10 ]; then p=00$page; else if [ $page -lt 100 ]; then p=0$page; else p=$page; fi; fi
        
        echo ----- PUBLISH page $p ----
        title=`echo $value | sed -e "s/\[[^]]*\]//g"`
        echo "+ chapter : $title"

		file=$dest/OEBPS/page_$p.html
		touch $file
		
        # HANDLE HEADER
        cat mods/tibibo/data/page_header.html | sed -e "s/%title%/${book} ${title} - ${page}/g" > $file
        
        echo -n "+ javascript : "
        echo "    <script type=\"text/javascript\" src=\"js/jquery.min.js\"></script>" >> $file
        for js in $dest/OEBPS/js/*.js ; do
            jsname=`basename $js`
            echo -n "$jsname "
            if [ `grep $jsname $file | wc -l` -eq 0 ] ; then
                echo "    <script type=\"text/javascript\" src=\"js/$jsname\"></script>" >> $file
            fi
        done
        echo
        
        echo -n "+ style : "
        for css in $dest/OEBPS/css/*.css ; do
            cssname=`basename $css`
            echo -n "$cssname "
            echo "    <link type=\"text/css\" rel=\"stylesheet\" href=\"css/$cssname\" media=\"all\"/>" >> $file
        done
        echo
        
        wget "$url/api/exercice.php?detail&source&nolocale&id=$label" -O p_json.tmp
        echo "{" > $dest/OEBPS/data/$lang/exercices_$idpage.json
        
        for ex in `cat p_json.tmp | sed -e 's/{\("id":"[^"]*","label"\)/\n{\1/g'` ; do
            if [ `echo $ex | grep activity | wc -l` -eq 1 ] ; then
                id=`echo $ex | sed -e 's/^.*id":"\([^"]\+\)","label":.*$/\1/g'`
                source=`echo $ex | sed -e 's/^.*source":"\([^"]\+\).*$/\1/g'`
                echo "+ processing $id"
                activity=`echo $ex | sed -e 's/^.*activity":"\([^"]\+\).*$/\1/g'`
                data=`echo $ex | sed -e 's/^.*,"data":\({.\+\),"ext".*$/\1/g'`
                
                echo "\"$id\":{\"activity\":\"$activity\",\"args\":$data}," >> $dest/OEBPS/data/$lang/exercices_$idpage.json
                
                if [ $stat -eq 1 ] ; then
                    if [ `grep ${activity}.js $file | wc -l` -eq 0 ] ; then
                        echo "    <script type=\"text/javascript\" src=\"activities/${activity}/${activity}.js\"></script>" >> $file
                        echo "    <link type=\"text/css\" rel=\"stylesheet\" href=\"activities/${activity}/style.css\" media=\"all\"/>" >> $file

                        echo "    - add $activity static javascript and style"
                    fi
                fi
                
                if [ ! -d $dest/OEBPS/activities/$activity ] ; then
                    echo "  - copy activities/$activity"
                    cp -rf activities/$activity $dest/OEBPS/activities/
                fi
                
                IFS=,
                ary=($source)
                for key in "${!ary[@]}"; do
                    s="${ary[$key]}"
                    d=`dirname $s`
                    if [ ! -d "$dest/OEBPS/$d" ] ; then
                        echo "  - build $d"
                        mkdir -p $dest/OEBPS/$d
                    fi
                    cp -rf $s $dest/OEBPS/$d
                done
                IFS=$'\n'
            fi
        done
        
        echo "\"zz\":0}" >> $dest/OEBPS/data/$lang/exercices_$idpage.json
        echo "{\"content\":\"${label}\"}" > $dest/OEBPS/data/$lang/content_$idpage.json
        
		cat mods/tibibo/data/page_footer.html | sed -e "s/%page%/${p}/g" -e "s/%chapid%/${idpage}/g" >> $file
        
        if [ ! -f $dest/OEBPS/data/$lang/content_$idpage.html ] ; then
            echo "<h1>$title</h1><h2>chapter : $idpage</h2>" > $dest/OEBPS/data/$lang/content_$idpage.html
        fi
        
        page=$((page+1))

    fi
fi
done

echo ----- BUILD manifest -----
#mods/tibibo/data/content.sh $dest/OEBPS > $dest/OEBPS/content.opf


rm -f p_*.tmp
