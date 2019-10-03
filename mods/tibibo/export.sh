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
icon="mods/tibibo/icon.svg"
deb=0

OPTIND=1

while getopts "h?i:u:s:t:v:p:d" opt; do
    case "$opt" in
    h|\?)
        echo "usage: $0 -i book id [OPTIONS]"
        echo "  -u [URL]    : jlodb website url             [$url]"
        echo "  -s [STRING] : save mode (cookies|local)     [$save]"
        echo "  -v [STRING] : version                       [$version]"
        echo "  -t [STRING] : target (default|file|android) [$target]"
        echo "  -p [FILE]   : icon                          [$icon]"
        echo "  -d			: debian packaging              [$deb]"
        exit 0
        ;;
    i)  tibibo=$OPTARG ;;
    u)  url=$OPTARG ;;
    s)  save=$OPTARG ;;
    t)  target=$OPTARG ;;
    v)  version=$OPTARG ;;
    p)  icon=$OPTARG ;;
    d)  deb=1 ;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

IFS=$'\n'

# CHECK TIBIBO ID
if [ -z $tibibo ] ; then
	echo "No tibibo book id"
	echo "usage: $0 -i book id [OPTIONS]"
	exit 0
fi

echo "---- TIBIBO exporting process as [`whoami`] ----"
echo " -i book      : $tibibo [$lang]"
echo " -u url       : $url"
echo " -t target    : $target [default|file|android]"
echo " -v version   : $version"
echo " -s savemode  : $save [cookies|local]"
echo " -p icon      : $icon"

# CLEAN AND PREPARE OUTPUT FOLDER
dest="export"
output="export/var/www/tibibo/$tibibo"

echo "---- PREPARING $dest/ ----"
echo "+ Cleaning and building $output/"

if [ ! -d $dest ]; then
	echo "+ Building $dest/"
	mkdir -p $dest
fi

rm -rf $dest/* 2> /dev/null
if [ -d $output ] ; then
	echo "+ ERROR: Can not clean $dest/ (rigth issue?)"
	exit
fi
mkdir -p $output/res/img/background/landscape $output/res/img/svginventoryicons/pencil/ $output/res/img/banners/ $output/css/ $output/ext/noto/svg/
mkdir -p $output/user $output/mods/tibibo/res/img $output/standalone/exercice $output/standalone/activity $output/activities
mkdir -p $output/res/img/icon/tab

echo -n "+ Copying files"
	
echo -n "."; cp -rf res/img/default $output/res/img/
echo -n "."; cp -rf res/img/classification $output/res/img/
echo -n "."; cp -rf res/img/activity $output/res/img/
echo -n "."; cp -rf mods/tibibo/res/img/thumbnail $output/mods/tibibo/res/img/
echo -n "."; cp -f mods/tibibo/res/img/*.svg $output/mods/tibibo/res/img/
echo -n "."; cp -f mods/tibibo/icon.svg $output/mods/tibibo/
echo -n "."; cp -rf js $output/
echo -n "."; cp -rf ext/js $output/ext/
echo -n "."; cp -f  css/jlodb.css $output/css/
echo -n "."; cp -rf user/res $output/user/res
echo -n "."; cp -f user/standalone* $output/user
echo -n "."; cp -f user/style.css $output/user

	# TODO: use API to get tibibo localisation
echo -n "."; cp -rf mods/tibibo/locale/$lang/text.json $output/standalone/locale.json
	
echo -n "."; cp -f res/img/icon/tab/tab00.svg $output/res/img/icon/tab/tab00.svg

echo -n "."; 
assets=( ext/noto/svg/emoji_u1f42d.svg ext/noto/svg/emoji_u1f42e.svg ext/noto/svg/emoji_u1f42f.svg ext/noto/svg/emoji_u1f43a.svg ext/noto/svg/emoji_u1f43b.svg ext/noto/svg/emoji_u1f43c.svg ext/noto/svg/emoji_u1f435.svg ext/noto/svg/emoji_u1f437.svg ext/noto/svg/emoji_u1f436.svg )
for a in "${assets[@]}"; do
	cp -f $a $output/$a
done

echo -n "."; cp -rf ext/font $output/ext/font
echo -n "."; cp -f res/img/background/landscape/blueboard01.svg $output/res/img/background/landscape/blueboard01.svg 
echo -n "."; cp -rf res/img/svginventoryicons/award $output/res/img/svginventoryicons/award
echo -n "."; cp -rf res/img/banners/jlodb_tibibo.svg $output/res/img/banners/jlodb_tibibo.svg
echo -n "."; cp -f res/img/svginventoryicons/pencil/brush01.svg $output/res/img/svginventoryicons/pencil/
echo -n "."; cp -f LICENSE $output/
echo

echo "+ Convert tibibo.html [standalone|$target|$save]"
grep -v gonz.js tibibo.html | sed -e "s|<title>Tibibo|<title>Tibibo:${tibibo}|g" -e 's/user\.js/standalone\.js/g' -e 's/\(standalone.*\)false/\1true/g' -e "s/\(platform.*\):[ ]*\"default\"/\1: \"${target}\"/g" -e "s/\(savemode.*\):[ ]*\"cookies\"/\1: \"${save}\"/g" -e "s/\(bookname.*\):[ ]*\"tibibo\"/\1: \"${tibibo}\"/g" -e "s/\(version.*\):[ ]*\"1.0\"/\1: \"${version}\"/g" > $output/index.html


if [ ! -f $icon ] ; then
	echo "+ ERROR: can not find $icon"
	exit
fi 

echo "+ Export icon from $icon"
inkscape $icon -e $output/favicon.ico -h 64 -w 64 > /dev/null
	
echo "---- GET data from $url ----"

# GET ALL ACTIVITY DESCRIPTION
link="$url/api/activity.php?locale=1"
echo "+ Get activity description"
echo "  . Request $link"
wget $link -O p_json.tmp -q

echo -n "  . Parse result"
for ac in `cat p_json.tmp | sed -e 's/{\("id":"[^"]*","name"\)/\n{\1/g' -e 's/\],[ ]*"from".*/,/g'` ; do
	if [ `echo $ac | grep locale | wc -l` -eq 1 ] ; then
		name=`echo $ac | sed -e 's/{"id":"\([^"]*\)".*/\1/g'`
		label=`echo $ac | sed -e 's/.*"label":"\([^"]*\)".*/\1/g'`
		loc=`echo $ac | sed  -e 's/.*locale":{\(.*\)}},/\1/g'`
		if [ -z $loc ] ; then
			echo "{\"label\":\"$label\"}"  > $output/standalone/activity/$name.json
		else
			echo "{\"label\":\"$label\",$loc}"  > $output/standalone/activity/$name.json
		fi
		echo -n "."
	fi
done
echo



# GET CONTENT AND RELATED JSON
content=$output/standalone/content.json
link="$url/mods/tibibo/api/book.php?value=$tibibo"
echo "+ Get book $tibibo"
echo "  . Request $link"
wget $link -O $content -q

if [ `file $content | grep "UTF-8" | wc -l` -eq 0 ]; then
	echo "  . Convert into UTF-8"
	iconv -f "windows-1252" -t "UTF-8" $content > tmp.tmp ; mv -f tmp.tmp $content
fi

desc=`cat $content | grep value | sed -e 's|.*value" : "\([^"]*\)".*|\1|g'`


# HANDLE EXERCICES

exercice()
{
wget "$url/api/exercice.php?detail&novariant&nolocale&source&id=$1" -O p_json.tmp -q
IFS=$'\n'

for ex in `cat p_json.tmp | sed -e 's/{\("id":"[^"]*","label"\)/\n{\1/g'` ; do
	if [ `echo $ex | grep activity | wc -l` -eq 1 ] ; then
		id=`echo $ex | sed -e 's/^.*id":"\([^"]\+\)","label":.*$/\1/g'`
		source=`echo $ex | sed -e 's/^.*source":"\([^"]\+\).*$/\1/g'`
        activity=`echo $ex | sed -e 's/^.*activity":"\([^"]\+\).*$/\1/g'`
        data=`echo $ex | sed -e 's/^.*,"reference":[^{]\+,"data":\({.\+\),"ext".*$/\1/g'`
                
		echo "{\"activity\":\"$activity\",\"data\":$data}" > $output/standalone/exercice/$id.json

		if [ ! -d "$output/activities/$activity" ] ; then
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
					mkdir -p $output/$d
				fi
				cp -rn $s $output/$d
			fi
        done
        IFS=$'\n'
        
        echo -n "."
    fi
done

}


echo "---- PROCESSING chapters ----"

for line in `cat $content | sed -e "s/{/\n/g"` ; do
if [ ! `echo $content | grep "[^ ]" | wc -l` -eq 0 ] ; then

    label=`echo $line | sed -e 's/^.*label":"\([^"]\+\).*$/\1/g'`
    ids=`echo $line | sed -e 's/^.*description":"//g' -e 's/","children.*$//g' -e 's/\[//g'`
    idpage=`echo $line | sed -e 's/^"id":\([0-9]\+\).*$/\1/g'`
    title=`echo $label | sed -e "s/\[[^]]*\]//g"`
	
	if [ ! -z $ids ] && [ ! `echo $line | grep label | grep -v node | wc -l` -eq 0 ]; then
	
		echo -n "+ Processing chapter [$title]"
		exercice $ids
		echo
	fi
fi
done

# DEBIAN PACKAGE
if [ $deb -eq 1 ] ; then
	echo "---- BUILDING Debian Packaging ----"
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

	output="export/var/www/tibibo/$tibibo/doc"
	mkdir -p $output/chrome
	cp -f bin/export/prefs.js $output
	chmod 644 $output/prefs.js
	cp -f bin/export/userChrome.css $output/chrome
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

	echo "+ Computing MD5SUMS"
	rm -f $output/md5sums
	touch $output/md5sums
	cd export
	for f in `find var -type f -print` ; do
		md5sum $f >> ../$output/md5sums
	done
	for f in `find usr -type f -print` ; do
		md5sum $f >> ../$output/md5sums
	done
	cd ..

	echo "+ Building package poufpouf${tibibo}_${version}_all.deb" 
	dpkg-deb --build export > /dev/null
	mv export.deb poufpouf${tibibo}_${version}_all.deb
fi

echo "---- THE END ----"
rm -f p_json.tmp
