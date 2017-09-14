#!/bin/bash

# CHECK ARGUMENTS
if [ ! -f "index.html" ]; then
    echo `basename $0` must be run from the jlodb folder root
    exit 1
fi

# PARAMETER DEFAULT VALUES
exs=""
dest=""
url="jlodb.poufpoufproduction.fr"
folder="."
quiet=""

OPTIND=1

while getopts "h?f:i:o:qu:" opt; do
    case "$opt" in
    h|\?)
        echo "usage: $0 -i id [OPTIONS]"
        echo "  -f [NAME]   : folder                       [.]"
        echo "  -q          : quiet                        [false]"
        echo "  -o          : integrated exercices output  []"
        echo "  -u [URL]    : jlodb website url            [jlodb.poufpoufproduction.fr]"
        exit 0
        ;;
    f)  folder=$OPTARG ;;
    i)  exs=$OPTARG ;;
    o)  dest=$OPTARG ;;
    q)  quiet="-q" ;;
    u)  url=$OPTARG ;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

# CHECK IDS
if [ -z $exs ] ; then
	echo "ERROR: exercice ids are missing..."
	echo "usage: $0 -i id [OPTIONS]"
	exit 0
fi

main()
{
wget "$url/api/exercice.php?detail&source&id=$1" -O p_json.tmp $quiet
IFS=$'\n'

echo "{"

for ex in `cat p_json.tmp | sed -e 's/{\("id":"[^"]*","label"\)/\n{\1/g'` ; do
	if [ `echo $ex | grep activity | wc -l` -eq 1 ] ; then
		id=`echo $ex | sed -e 's/^.*id":"\([^"]\+\)","label":.*$/\1/g'`
		source=`echo $ex | sed -e 's/^.*source":"\([^"]\+\).*$/\1/g'`
        if [ -z $quiet ]; then  echo "+ processing $id"; fi
        activity=`echo $ex | sed -e 's/^.*activity":"\([^"]\+\).*$/\1/g'`
        data=`echo $ex | sed -e 's/^.*,"data":\({.\+\),"ext".*$/\1/g'`
                
        echo "\"$id\":{\"activity\":\"$activity\",\"args\":$data},"
        
        if [ ! -z $dest ] ; then 
        
            IFS=,
            ary=($source)
            for key in "${!ary[@]}"; do
                s="${ary[$key]}"
                if [[ $s == [* ]] ; then
                    ref=`echo $s | sed -e 's/\[\(.*\)\]/\1/g'`
                    echo -n "$ref," >> p_ex.tmp
                fi
            done
            IFS=$'\n'
        fi
    fi
done

echo "\"zz\":0}"

}

if [ ! -z $dest ] ; then
    if [ -z $quiet ]; then  echo "+ handle embedded exercices"; fi
    echo "" > p_ex.tmp
fi
main $exs

if [ ! -z $dest ] ; then
    exs=`cat p_ex.tmp | sed -e 's/\(.*\),$/\1/g'`
    if [ ! -z $exs ] ; then main $exs ; fi
fi

rm -f p_ex.tmp
