#!/bin/bash

# CHECK ARGUMENTS
if [ ! -f "index.html" ]; then
    echo `basename $0` must be run from the jlodb folder root
    exit 1
fi

# PARAMETER DEFAULT VALUES
tibibo=""
url="jlodb.poufpoufproduction.fr"
save="cookies"
lang="fr-FR"
version="1.0"
target="default"
clean="1"

OPTIND=1

while getopts "h?i:u:s:t:v:" opt; do
    case "$opt" in
    h|\?)
        echo "usage: $0 book id [OPTIONS]"
        echo "  -u [URL]    : jlodb website url             [jlodb.poufpoufproduction.fr]"
        echo "  -s          : save mode (cookies|local)     [cookies]"
        echo "  -v          : version                       [1.0]"
        echo "  -t          : target (default|file|android) [default]"
        exit 0
        ;;
    i)  tibibo=$OPTARG ;;
    u)  url=$OPTARG ;;
    s)  save=$OPTARG ;;
    t)  target=$OPTARG ;;
    v)  version=$OPTARG ;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

IFS=$'\n'

# CHECK TIBIBO ID
if [ -z $tibibo ] ; then echo "No tibibo book id"; exit 0; fi

# CLEAN AND PREPARE OUTPUT FOLDER
output="export/var/www/tibibo/$tibibo"
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
	cp -rf ext/font $output/ext/font
	cp -f res/img/background/landscape/blueboard01.svg $output/res/img/background/landscape/blueboard01.svg 
	cp -rf res/img/svginventoryicons/award $output/res/img/svginventoryicons/award
	cp -f res/img/svginventoryicons/pencil/brush01.svg $output/res/img/svginventoryicons/pencil/

	grep -v gonz.js tibibo.html | sed -e "s|<title>Tibibo|<title>Tibibo:${tibibo}|g" -e 's/user\.js/standalone\.js/g' -e 's/\(standalone.*\)false/\1true/g' -e "s/\(platform.*\)\"default\"/\1\"${target}\"/g" -e "s/\(savemode.*\)\"cookies\"/\1\"${save}\"/g" > $output/index.html
	inkscape mods/tibibo/locale/$lang/$tibibo.svg -e $output/favicon.ico -h 64 -w 64
	
	cp -f LICENSE $output/

	# GET ALL ACTIVITY DESCRIPTION
	echo "+ get activity description"
	wget "$url/api/activity.php?locale=1" -O p_json.tmp

	for ac in `cat p_json.tmp | sed -e 's/{\("id":"[^"]*","name"\)/\n{\1/g' -e 's/\],[ ]*"from".*/,/g'` ; do
		if [ `echo $ac | grep locale | wc -l` -eq 1 ] ; then
			name=`echo $ac | sed -e 's/{"id":"\([^"]*\)".*/\1/g'`
			label=`echo $ac | sed -e 's/.*"label":"\([^"]*\)".*/\1/g'`
			loc=`echo $ac | sed  -e 's/.*locale":{\(.*\)}},/\1/g'`
			echo "{\"label\":\"$label\",$loc}"  > $output/standalone/activity/$name.json
		fi
	done

	# GET CONTENT AND RELATED JSON
	wget "$url/mods/tibibo/api/book.php?value=$tibibo" -O $content

	if [ `file $content | grep "UTF-8" | wc -l` -eq 0 ]; then
		echo "+ convert $content into UTF-8"
		iconv -f "windows-1252" -t "UTF-8" $content > tmp.tmp ; mv -f tmp.tmp $content
	fi

fi

desc=`cat $content | grep value | sed -e 's|.*value" : "\([^"]*\)".*|\1|g'`


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

# DEBIAN PACKAGE
output="export/usr/bin"
mkdir -p $output
cat mods/tibibo/poufpouf.sh | sed -e "s|%tibibo%|${tibibo}|g" -e "s|%version%|${version}|g"> $output/poufpouf_$tibibo.sh
chmod 755 $output/poufpouf_$tibibo.sh

output="export/usr/share/applications"
mkdir -p $output
echo "[Desktop Entry]" > $output/$tibibo.desktop
echo "Version=$version" >> $output/$tibibo.desktop
echo "Name=PoufPouf $tibibo" >> $output/$tibibo.desktop
echo "Comment=$desc" >> $output/$tibibo.desktop
echo "Exec=poufpouf_$tibibo.sh" >> $output/$tibibo.desktop
echo "Icon=/var/www/tibibo/$tibibo/favicon.ico" >> $output/$tibibo.desktop
echo "Terminal=false" >> $output/$tibibo.desktop
echo "Type=Application" >> $output/$tibibo.desktop
echo "Categories=Education;" >> $output/$tibibo.desktop
echo "Keywords=education" >> $output/$tibibo.desktop

output="export/usr/share/doc/poufpouf/firefox"
mkdir -p $output/chrome
cp -f bin/prefs.js $output
chmod 644 $output/pref.js
cp -f bin/userChrome.css $output/chrome
chmod 644 $output/chrome/*

output="export/DEBIAN"
mkdir -p $output
echo "Package: poufpouf$tibibo" > $output/control
echo "Version: $version" >> $output/control
echo "Installed-Size: 568" >> $output/control
echo "Maintainer: Johann C. <johannc@poufpoufproduction.fr>" >> $output/control
echo "Architecture: all" >> $output/control
echo "Priority: optional" >> $output/control
echo "Depends: firefox | firefox-esr" >> $output/control
echo "Description: $desc" >> $output/control

rm -f $output/md5sums
touch $output/md5sums
cd export
for f in `find var -type f -print` ; do
	echo "md5sum $f >> ../$output/md5sums"
	md5sum $f >> ../$output/md5sums
done
for f in `find usr -type f -print` ; do
	md5sum $f >> ../$output/md5sums
done
cd ..

dpkg-deb --build export
echo mv export.deb poufpouf${tibibo}_${version}_all.deb
mv export.deb poufpouf${tibibo}_${version}_all.deb


rm -f p_json.tmp
