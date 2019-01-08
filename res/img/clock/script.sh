#!/bin/sh


# READ PARAMETERS
OPTIND=1
withmin=0
id=1
st=0
output=""

while getopts "h?msi:o:" opt; do
    case "$opt" in
    h|\?)
        echo usage: $0 -m
        exit 0
        ;;
    m)  withmin=1
        ;;
    s)  st=1
        ;;
	i)	id=$OPTARG
		;;
	o)	output=$OPTARG
		;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

if [ ! -d output ] ; then mkdir output ; fi

for h in $(seq 0 11); do 
for m in $(seq 0 11); do

	# COMPUTE

	tmp=`echo "$m*5" | bc`
	am=`echo "$m*30" | bc`

	if [ $st -eq 1 ] ; then ah=`echo "$h*30+$m*2.5" | bc` ; else ah=`echo "$h*30" | bc` ; fi
	if [ $tmp -lt 10 ] ; then mm="0$tmp" ; else mm=$tmp ; fi
	if [ $h -lt 10 ] ; then hh="0$h" ; else hh=$h ; fi
	
	filename="output/clock$output$hh$mm.svg" 

	# PREPARE BG

	if [ $id -ne 0 ] ; then
	
		swatch=`cat swatch0$id.svg | grep -v "</svg>" | wc -l`
		if [ $withmin -eq 1 ] ; then
			head --lines $swatch swatch0$id.svg > $filename
		else
			head --lines $swatch swatch0$id.svg | grep -v "min" | grep -v "use" > $filename
		fi

	else
	
		head --lines 3 swatch01.svg > $filename
		
	fi

	cat minute.svg | grep -v xml | grep -v svg | grep -v defs | sed -e "s/rotate(0)/rotate($am)/g" >> $filename
	cat hour.svg | grep -v xml | grep -v svg | grep -v defs | sed -e "s/rotate(0)/rotate($ah)/g" >> $filename

	echo "</svg>" >> $filename

done
done
	
