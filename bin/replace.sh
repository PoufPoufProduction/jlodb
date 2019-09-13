#!/bin/sh
if [ $# -lt 3 ] ; then echo "usage: $0 from to files ($#)"; exit; fi
c=1
cc=1

for f in $@; do
	if [ $c -gt 2 ]; then
		if [ -f $f ]; then
			if [ `grep "$1" $f | wc -l` -ne 0 ] ; then
				sed -e "s/$1/$2/g" $f > .tmp
				echo --- $f ---
				diff --strip-trailing-cr $f .tmp
				read -p "($cc) Confirmation [Y/n] " -n 1 -r
				echo
				if [[ $REPLY =~ ^[Nn]$ ]]
				then
					echo Skip
					rm .tmp
				else
					echo Process
					mv -f .tmp $f
				fi
				cc=$(($cc+1))
				
			fi
		fi
	fi
	c=$(($c+1))
done

