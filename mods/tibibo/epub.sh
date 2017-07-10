#!/bin/bash

# CHECK ARGUMENTS
if [ ! -f "index.html" ]; then
    echo `basename $0` must be run from the jlodb folder root
    exit 1
fi

url="jlodb.poufpoufproduction.fr"
type="epub"
book="prog"

OPTIND=1

while getopts "h?u:t:b:" opt; do
    case "$opt" in
    h|\?)
        echo usage: $0 -u url -t type -b book_id
        exit 0
        ;;
    u)  url=$OPTARG
        ;;
    t)  type=$OPTARG
        ;;
    b)  book=$OPTARG
        ;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

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

# CLEANING STUFF
echo ----- CLEAN and INITIALIZE -----
dest=output
IFS=$'\n'
rm -f p_*.tmp
rm -rf $dest

# GET JSON FILE
file=""
if [ -f $book ]; then file=$book
else if [ -f "$book.json" ]; then
    echo "+ book book from file"
	file="$id.json"
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

# GET ACTIVITIES DATA
echo ----- GET activities information -----
echo "var activities = {" >> p_activities.tmp
wget "$url/api/activity.php?locale" -O p_json.tmp
echo -n "+ processing"
for a in `cat p_json.tmp | sed -e 's/{"id":/\n{"id":/g'` ; do
    if [ `echo $a | grep label | wc -l` -eq 1 ]; then
        id=`echo $a | sed -e 's/^.*id":"\([^"]\+\).*$/\1/g'`
        label=`echo $a | sed -e 's/^.*label":"\([^"]\+\).*$/\1/g'`
        locale=`echo $a | sed -e 's/^.*locale":\(.\+}\)}.*$/\1/g'`
        echo -n " $id"
        echo "<!--  <script type=\"text/javascript\" src=\"activities/${id}/${id}.js\"></script> -->" >> p_header.tmp
        echo "<!--  <link type=\"text/css\" rel=\"stylesheet\" href=\"activities/${id}/style.css\" media=\"all\"/> -->" >> p_header.tmp
        echo "// ${id}:{label:\"${label}\",locale:${locale}}," >> p_activities.tmp
    fi
done
echo "zzz:{}" >> p_activities.tmp
echo "}" >> p_activities.tmp
echo "... OK"

# BUILD FOLDER
echo ----- PREPARE folder $dest -----
mkdir -p $dest/OEBPS $dest/OEBPS/res/img/ $dest/OEBPS/css $dest/OEBPS/activities
cp -r mods/tibibo/epub/META-INF/ $dest/
cp -f mods/tibibo/epub/mimetype $dest/
cp -r res/img/default $dest/OEBPS/res/img/
cp -r js $dest/OEBPS/
cp -f css/jlodb.css $dest/OEBPS/css/


#TOC.NCX
echo ----- BUILD TABLE OF CONTENT toc.ncx -----
sed -e "s/%uuid%/${uid}/g" mods/tibibo/epub/toc.ncx > $dest/OEBPS/toc.ncx

page=1
for line in `cat $file | sed -e "s/{/\n/g"` ; do
if [ ! `echo $line | grep "[^ ]" | wc -l` -eq 0 ] ; then

    value=`echo $line | sed -e 's/^.*label":"\([^"]\+\).*$/\1/g'`
    label=`echo $line | sed -e 's/^.*description":"//g' -e 's/","children.*$//g' -e 's/\[//g'`
    
    if [ ! -z $label ]; then
 
        if [ $page -lt 10 ]; then p=00$page; else if [ $page -lt 100 ]; then p=0$page; else p=$page; fi; fi
        
        echo ----- PUBLISH page $p -----
        echo $value

        cp mods/tibibo/epub/page_header.xhtml $dest/OEBPS/page_$p.xhtml
        cp p_activities.tmp p_locale$p.tmp
        cp p_header.tmp p_header$p.tmp
            
        wget "$url/api/exercice.php?detail&source&nolocale&id=$label" -O p_json.tmp
        echo "var exercices={" > p_exercices.tmp
        
        for ex in `cat p_json.tmp | sed -e 's/{\("id":"[^"]*","label"\)/\n{\1/g'` ; do
            if [ `echo $ex | grep activity | wc -l` -eq 1 ] ; then
                id=`echo $ex | sed -e 's/^.*id":"\([^"]\+\)","label":.*$/\1/g'`
                source=`echo $ex | sed -e 's/^.*source":"\([^"]\+\).*$/\1/g'`
                echo "+ processing $id"
                activity=`echo $ex | sed -e 's/^.*activity":"\([^"]\+\).*$/\1/g'`
                data=`echo $ex | sed -e 's/^.*,"data":\({.\+\),"ext".*$/\1/g'`
                cat p_header$p.tmp | sed -e "s|<!--  \(.*${activity}/.*\) -->|\1|g" > tmp.tmp; mv tmp.tmp p_header$p.tmp
                cat p_locale$p.tmp | sed -e "s|// \(${activity}:.*$\)|\1|g" > tmp.tmp; mv tmp.tmp p_locale$p.tmp
                echo "$id:{activity:\"$activity\",args:$data}," >> p_exercices.tmp
                
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
        
        cat p_header$p.tmp | sed -e "s/<\!.*$//g" | grep -e . >> $dest/OEBPS/page_$p.xhtml
        echo "<script><![CDATA[" >> $dest/OEBPS/page_$p.xhtml
        cat p_locale$p.tmp | sed -e "s|^//.*$||g" | grep -e . >> $dest/OEBPS/page_$p.xhtml
        
        echo "var content='$label';" >> $dest/OEBPS/page_$p.xhtml
        
        cat p_exercices.tmp >> $dest/OEBPS/page_$p.xhtml
        echo "zz:0};" >> $dest/OEBPS/page_$p.xhtml
        
        title=`echo $value | sed -e "s/\[[^]]*\]//g"`
        cat mods/tibibo/epub/page_footer.xhtml | sed -e "s/%content%/${title}/g" >> $dest/OEBPS/page_$p.xhtml
        
        rm p_header$p.tmp p_locale$p.tmp p_exercices.tmp
        
        page=$((page+1))

    fi
fi
done

echo ----- BUILD manifest -----
mods/tibibo/epub/content.sh $dest/OEBPS > $dest/OEBPS/content.opf


rm -f p_*.tmp
