#!/bin/sh

cat "$1" | sed -e "s/$/ /g" | tr -d '\n' | sed -e "s/\([^A-Z][.?!]\) /\1\n/g"| sed -e "s/--//g" -e "s/[ ]\+/ /g" -e "s/^ //g" > .tmp

IFS=$'\n'
for f in `cat .tmp` ; do

nb=`echo $f | wc -c`
max=100
min=20
if [ "$nb" -gt "$min" ] ; then
if [ "$nb" -lt "$max" ] ; then
	if [ "$nb" -lt 10 ] ; then
		echo -n "00" 
	else
		if [ "$nb" -lt 100 ] ; then
			echo -n "0"
		fi
	fi
	echo "$nb - $f"
fi
fi

done

rm -f .tmp