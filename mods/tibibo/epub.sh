#!/bin/bash

# CHECK ARGUMENTS
if [ ! -f "index.html" ]; then
    echo `basename $0` must be run from the jlodb folder root
    exit 1
fi

if [ "$#" -lt 2 ]; then
    echo "usage : `basename $0` host [json file|tibibo id]"
    exit 1
fi

# CLEANING STUFF
echo ----- CLEAN and INITIALIZE -----
dest=output
IFS=$'\n'
rm -f p_*.tmp
rm -rf $dest

# GET JSON FILE
file=""
if [ -f $2 ]; then file=$2
else if [ -f "$2.json" ]; then file="$2.json"
else
    echo "get book from website"
    file="$2.json"
    wget "$1/mods/tibibo/api/book.php?value=$2" -O p_json.tmp
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
wget "$1/api/activity.php?locale" -O p_json.tmp
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
mkdir -p $dest/res/img/ $dest/css $dest/activities
cp -r mods/tibibo/epub/META-INF/ $dest/
cp -f mods/tibibo/epub/mimetype $dest/
cp -f mods/tibibo/epub/toc.ncx $dest/
cp -r res/img/default $dest/res/img/
cp -r js $dest/
cp -f css/jlodb.css $dest/css/

page=1
for line in `cat $file | sed -e "s/{/\n/g"` ; do
if [ ! `echo $line | grep "[^ ]" | wc -l` -eq 0 ] ; then

    value=`echo $line | sed -e 's/^.*label":"//g' -e 's/","description.*$//g' -e 's/\[[^]]*\]//g'`
    label=`echo $line | sed -e 's/^.*description":"//g' -e 's/","children.*$//g' -e 's/\[//g'`
    
    if [ ! -z $label ]; then
 
        if [ $page -lt 10 ]; then p=00$page; else if [ $page -lt 100 ]; then p=0$page; else p=$page; fi; fi
        
        echo ----- PUBLISH page $p -----
        echo $value

        cp mods/tibibo/epub/page_header.html $dest/page_$p.html
        cp p_activities.tmp p_locale$p.tmp
        cp p_header.tmp p_header$p.tmp
            
        wget "$1/api/exercice.php?detail&source&nolocale&id=$label" -O p_json.tmp
        echo "var exercices={" > p_exercices.tmp
        for ex in `cat p_json.tmp | sed -e 's/{"id":/\n{"id":/g'` ; do
            if [ `echo $ex | grep activity | wc -l` -eq 1 ] ; then
                id=`echo $ex | sed -e 's/^.*id":"\([^"]\+\)","label":.*$/\1/g'`
                source=`echo $ex | sed -e 's/^.*source":"\([^"]\+\).*$/\1/g'`
                echo "+ processing $id"
                activity=`echo $ex | sed -e 's/^.*activity":"\([^"]\+\).*$/\1/g'`
                data=`echo $ex | sed -e 's/^.*,"data":\({.\+\),"ext".*$/\1/g'`
                cat p_header$p.tmp | sed -e "s|<!--  \(.*${activity}/.*\) -->|\1|g" > tmp.tmp; mv tmp.tmp p_header$p.tmp
                cat p_locale$p.tmp | sed -e "s|// \(${activity}:.*$\)|\1|g" > tmp.tmp; mv tmp.tmp p_locale$p.tmp
                echo "$id:{activity:\"$activity\",args:$data}," >> p_exercices.tmp
                
                if [ ! -d $dest/activities/$activity ] ; then
                    echo "  - copy activities/$activity"
                    cp -rf activities/$activity $dest/activities/
                fi
                
                IFS=,
                ary=($source)
                for key in "${!ary[@]}"; do
                    s="${ary[$key]}"
                    d=`dirname $s`
                    if [ ! -d "$dest/$d" ] ; then
                        echo "  - build $d"
                        mkdir -p $dest/$d
                    fi
                    cp -rf $s $dest/$d
                done
                IFS=$'\n'
                
            fi
        done
        
        cat p_header$p.tmp | sed -e "s/<\!.*$//g" | grep -e . >> $dest/page_$p.html
        echo "<script>" >> $dest/page_$p.html
        cat p_locale$p.tmp | sed -e "s|^//.*$||g" | grep -e . >> $dest/page_$p.html
        
        echo "var content='$label';" >> $dest/page_$p.html
        
        cat p_exercices.tmp >> $dest/page_$p.html
        echo "zz:0};" >> $dest/page_$p.html
        
        cat mods/tibibo/epub/page_footer.html | sed -e "s/%content%/${value}/g" >> $dest/page_$p.html
        
        rm p_header$p.tmp p_locale$p.tmp p_exercices.tmp
        
        page=$((page+1))

    fi
fi
done

echo ----- BUILD manifest -----
mods/tibibo/epub/content.sh $dest > $dest/content.opf


rm -f p_*.tmp
