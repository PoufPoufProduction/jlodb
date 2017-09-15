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

OPTIND=1

while getopts "h?f:i:ou:" opt; do
    case "$opt" in
    h|\?)
        echo "usage: $0 -i id [OPTIONS]"
        echo "  -f [NAME]   : folder                       [.]"
        echo "  -o          : integrated exercices output  []"
        echo "  -u [URL]    : jlodb website url            [jlodb.poufpoufproduction.fr]"
        exit 0
        ;;
    f)  folder=$OPTARG ;;
    i)  exs=$OPTARG ;;
    o)  dest="1" ;;
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
wget "$url/api/exercice.php?source&novariant&id=$1" -O p_json.tmp
IFS=$'\n'


for ex in `cat p_json.tmp | sed -e 's/{\("id":"[^"]*","label"\)/\n{\1/g'` ; do
	if [ `echo $ex | grep activity | wc -l` -eq 1 ] ; then
		id=`echo $ex | sed -e 's/^.*id":"\([^"]\+\)","label":.*$/\1/g'`
        source=`echo $ex | sed -e 's/^.*source":"\([^"]\+\).*$/\1/g'`
        activity=`echo $ex | sed -e 's/^.*activity":"\([^"]\+\).*$/\1/g'`
        echo "+ processing $id: $source ($activity)"
        
        if [ ! -d $folder/activities ] ; then
            echo "+ build activities/ folder"
            mkdir -p $folder/activities
        fi
        
        if [ ! -d $folder/activities/$activity ] ; then
            echo "+ copy activities/$activity"
            cp -rf activities/$activity $folder/activities/
        fi
          
        IFS=,
        ary=($source)
        for key in "${!ary[@]}"; do
			s="${ary[$key]}"
			
			if [[ $s == [* ]] ; then
				ref=`echo $s | sed -e 's/\[\(.*\)\]/\1/g'`
				echo -n "$ref," >> p_ref.tmp
			else
				d=`dirname $s`
				if [ ! -d "$folder/$d" ] ; then
					echo "  - build $d"
					mkdir -p $folder/$d
				fi
				echo "  - copy $s"
				cp -rf $s $folder/$d
			fi
        done
        IFS=$'\n'
    fi
done

}

echo "" > p_ref.tmp
main $exs

if [ ! -z $dest ] ; then 
    exs=`cat p_ref.tmp | sed -e 's/\(.*\),$/\1/g'`
    if [ ! -z $exs ] ; then main $exs ; fi
fi

rm -f p_*.tmp
