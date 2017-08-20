#!/bin/bash

# CHECK ARGUMENTS
if [ ! -f "index.html" ]; then
    echo `basename $0` must be run from the jlodb folder root
    exit 1
fi

# PARAMETER DEFAULT VALUES
book=""
url="jlodb.poufpoufproduction.fr"
chapter=""
quiet=""

OPTIND=1

while getopts "h?b:c:qu:" opt; do
    case "$opt" in
    h|\?)
        echo "usage: $0 -b book_id [OPTIONS]"
        echo "  -c [INT]    : chapter id                   []"
        echo "  -q          : quiet                        [false]"
        echo "  -u [URL]    : jlodb website url            [jlodb.poufpoufproduction.fr]"
        exit 0
        ;;
    b)  book=$OPTARG ;;
    c)  chapter=$OPTARG ;;
    q)  quiet="-q" ;;
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

if [ -f "p_$book.tmp" ]; then
	file="p_$book.tmp";
	if [ -z $quiet ]; then echo "+ Get book from $file" ; fi
else
	if [ -z $quiet ]; then echo "+ Get book from website" ; fi
	file="p_$book.tmp"
	wget "$url/mods/tibibo/api/book.php?value=$book" -O p_json.tmp $quiet
	cat p_json.tmp | sed -e 's/^.*description":\[//g' -e 's/\],  "comment".*$//g' > $file
	rm -f p_json.tmp
fi

if [ `file $file | grep "UTF-8" | wc -l` -eq 0 ]; then
    echo ----- CONVERT $file into UTF-8 -----
    iconv -f "windows-1252" -t "UTF-8" $file > tmp.tmp ; mv -f tmp.tmp $file
fi

IFS=$'\n'

for line in `cat $file | sed -e "s/{/\n/g"` ; do
if [ ! `echo $line | grep "[^ ]" | wc -l` -eq 0 ] ; then

    label=`echo $line | sed -e 's/^.*label":"\([^"]\+\).*$/\1/g'`
    ids=`echo $line | sed -e 's/^.*description":"//g' -e 's/","children.*$//g' -e 's/\[//g'`
    idpage=`echo $line | sed -e 's/^"id":\([0-9]\+\).*$/\1/g'`
    title=`echo $label | sed -e "s/\[[^]]*\]//g"`

    
    if [ ! -z $ids ]; then
		if [ -z $chapter ]; then
			echo "$idpage:$title"
		else
			if [ "$chapter" = "$idpage" ]; then echo $ids ; fi
		fi
    fi
fi
done

