#!/bin/bash

# CHECK ARGUMENTS
if [ ! -f "index.html" ]; then
    echo `basename $0` must be run from the jlodb folder root
    exit 1
fi

# PARAMETER DEFAULT VALUES
tibibo=""
folder="tibibo"
url="jlodb.poufpoufproduction.fr"
save="cookie"
lang="fr-FR"
clean="1"

OPTIND=1

while getopts "h?i:u:f:s:" opt; do
    case "$opt" in
    h|\?)
        echo "usage: $0 -i tibibo book id [OPTIONS]"
        echo "  -f [NAME]   : output folder                [tibibo]"
        echo "  -u [URL]    : jlodb website url            [jlodb.poufpoufproduction.fr]"
        echo "  -s          : save mode (cookie|local)     [cookie]"
        exit 0
        ;;
    i)  tibibo=$OPTARG ;;
    f)  folder=$OPTARG ;;
    u)  url=$OPTARG ;;
    s)  save=$OPTARG ;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

IFS=$'\n'

# CHECK TIBIBO ID
if [ -z $tibibo ] ; then echo "No tibibo book id"; exit 0; fi

# CLEAN AND PREPARE OUTPUT FOLDER
output="export/$folder"
content=$output/standalone/content.json

if [ ! -z $clean ]; then

	echo "+ Clean $output"; rm -rf $output;
	mkdir -p $output/res/img/background/landscape $output/res/img/svginventoryicons/pencil/ $output/css $output/ext/noto/svg/
	mkdir -p $output/user $output/mods/tibibo/res/img $output/standalone/exercice $output/standalone/activity $output/activities
	mkdir -p $output/res/img/icon/tab
	
	cp -rf res/img/default $output/res/img/
	cp -rf res/img/classification $output/res/img/
	cp -rf res/img/activity $output/res/img/
	cp -rf mods/tibibo/res/img/thumbnail $output/mods/tibibo/res/img/
	cp -f mods/tibibo/res/img/*.svg $output/mods/tibibo/res/img/
	cp -f mods/tibibo/icon.svg $output/mods/tibibo/
	cp -rf js $output/
	cp -f  css/jlodb.css $output/css/
	cp -rf user/res $output/user/res
	cp -f user/standalone* $output/user
	cp -f user/style.css $output/user

	# TODO: use API to get tibibo localisation
	cp -rf mods/tibibo/locale/$lang/text.json $output/standalone/locale.json
	
	cp -f res/img/icon/tab/tab00.svg $output/res/img/icon/tab/tab00.svg

	assets=( ext/noto/svg/emoji_u1f42d.svg ext/noto/svg/emoji_u1f42e.svg ext/noto/svg/emoji_u1f42f.svg ext/noto/svg/emoji_u1f43a.svg ext/noto/svg/emoji_u1f43b.svg ext/noto/svg/emoji_u1f43c.svg ext/noto/svg/emoji_u1f435.svg ext/noto/svg/emoji_u1f437.svg ext/noto/svg/emoji_u1f436.svg )
	for a in "${assets[@]}"; do
		cp -f $a $output/$a
	done
	cp -f res/img/background/landscape/blueboard01.svg $output/res/img/background/landscape/blueboard01.svg 
	cp -rf res/img/svginventoryicons/award $output/res/img/svginventoryicons/award
	cp -f res/img/svginventoryicons/pencil/brush01.svg $output/res/img/svginventoryicons/pencil/

	grep -v gonz.js tibibo.html | sed -e 's/user\.js/standalone\.js/g' -e 's/\(standalone.*\)false/\1true/g'  > $output/index.html

	# GET ALL ACTIVITY DESCRIPTION
	echo "+ get activity description"
	wget "$url/api/activity.php?locale=1" -O p_json.tmp

	for ac in `cat p_json.tmp | sed -e 's/{\("id":"[^"]*","name"\)/\n{\1/g' -e 's/\],[ ]*"from".*/,/g'` ; do
		if [ `echo $ac | grep locale | wc -l` -eq 1 ] ; then
			name=`echo $ac | sed -e 's/{"id":"\([^"]*\)".*/\1/g'`
			echo $ac | sed  -e 's/.*locale":\(.*\)}},/\1}/g' > $output/standalone/activity/$name.json
		fi
	done

	# GET CONTENT AND RELATED JSON
	wget "$url/mods/tibibo/api/book.php?value=$tibibo" -O $content

	if [ `file $content | grep "UTF-8" | wc -l` -eq 0 ]; then
		echo "+ convert $content into UTF-8"
		iconv -f "windows-1252" -t "UTF-8" $content > tmp.tmp ; mv -f tmp.tmp $content
	fi

fi

# HANDLE EXERCICES

exercice()
{
wget "$url/api/exercice.php?detail&novariant&source&id=$1" -O p_json.tmp $quiet
IFS=$'\n'

for ex in `cat p_json.tmp | sed -e 's/{\("id":"[^"]*","label"\)/\n{\1/g'` ; do
	if [ `echo $ex | grep activity | wc -l` -eq 1 ] ; then
		id=`echo $ex | sed -e 's/^.*id":"\([^"]\+\)","label":.*$/\1/g'`
		source=`echo $ex | sed -e 's/^.*source":"\([^"]\+\).*$/\1/g'`
        if [ -z $quiet ]; then  echo "+ processing $id"; fi
        activity=`echo $ex | sed -e 's/^.*activity":"\([^"]\+\).*$/\1/g'`
        data=`echo $ex | sed -e 's/^.*,"reference":[^{]\+,"data":\({.\+\),"ext".*$/\1/g'`
                
        echo "$id : $data"
		echo "{\"activity\":\"$activity\",\"data\":$data}" > $output/standalone/exercice/$id.json

		if [ ! -d "$output/activities/$activity" ] ; then
			echo "  - copy activities/$activity"
			cp -rf activities/$activity $output/activities/
		fi
		
        IFS=,
        ary=($source)
        for key in "${!ary[@]}"; do
            s="${ary[$key]}"
            if [[ $s == [* ]] ; then
				# TODO : Handle embedded exercices
                echo "TO DEAL WITH $id"
            else
				d=`dirname $s`
				if [ ! -d "$output/$d" ] ; then
					echo "  - build $d"
					mkdir -p $output/$d
				fi
				echo "  - copy $s"
				cp -rn $s $output/$d
			fi
        done
        IFS=$'\n'
    fi
done

}

for line in `cat $content | sed -e "s/{/\n/g"` ; do
if [ ! `echo $content | grep "[^ ]" | wc -l` -eq 0 ] ; then

    label=`echo $line | sed -e 's/^.*label":"\([^"]\+\).*$/\1/g'`
    ids=`echo $line | sed -e 's/^.*description":"//g' -e 's/","children.*$//g' -e 's/\[//g'`
    idpage=`echo $line | sed -e 's/^"id":\([0-9]\+\).*$/\1/g'`
    title=`echo $label | sed -e "s/\[[^]]*\]//g"`
	
	if [ ! -z $ids ] && [ ! `echo $line | grep label | grep -v node | wc -l` -eq 0 ]; then
	
		echo "+ processing chapter $idpage"
		exercice $ids
	fi
fi
done

rm -f p_json.tmp
