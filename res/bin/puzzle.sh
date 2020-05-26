#!/bin/bash

if [ $# -ne 2 ] ; then echo "usage: $0 filename [2-6]" ; exit ; fi
if [ ! -f "minisvg.sh" ] ; then echo "can not find script minisvg.sh" ; exit ; fi
if [ ! -f "$1" ] ; then echo "can not find svg image $1" ; exit ; fi
if [ `grep "<g" $1 | wc -l` -ne 0 ] ; then echo "please remove all groups in $1 (CTRL+U in Inkscape)" ; exit ; fi
if [ `grep "viewBox=\"0 0 96 96\"" $1 | wc -l` -eq 0 ] ; then echo "please set viewBox to '0 0 96 96'" ; exit ; fi
if [ `inkscape --verb-list | grep su-v/org.inkscape.effect.path.intersect | wc -l` -eq 0 ] ; then echo "can not find Inkscape multiple object intersect plugin [https://gitlab.com/su-v/inx-pathops]" ; exit ; fi
if [ $2 -gt 6 ] ; then echo "usage: $0 filename [2-6]" ; exit ; fi
if [ $2 -lt 2 ] ; then echo "usage: $0 filename [2-6]" ; exit ; fi

inval=(1 1 48 32 24 19.2 16)
outval=(1 1 72 48 36 30 24)
inner=${inval[$2]}
outer=${outval[$2]}
border=`echo "scale=1;($outer - $inner )/2" | bc -l`

base=`basename $1 .svg`
wip="$base.tmp.svg"
if [ ! -f "$wip" ] ; then
	echo "Prepare $wip [$inner $outer $border]"
	cp $1 $wip
	inkscape --verb=EditSelectAllInAllLayers --verb=SelectionGroup --verb=FileSave --verb=FileQuit $wip
	./minisvg.sh $wip > .tmp.svg
	mv -f .tmp.svg $wip
fi

n="xyui12k"
e=$(($2-1))

for i in `seq 0 $e` ; do
for j in `seq 0 $e` ; do

tile="$base$i$j.svg"
ii=`echo "$border-$i*$inner" | bc -l`
jj=`echo "$border-$j*$inner" | bc -l`
cat $wip | sed -e "s/<g [^>]*>/<g id='g$n' transform=\"translate($ii,$jj)\">/g" | sed -e "s|</g>|</g><rect id=\"r$n\" x=\"0\" y=\"0\" width=\"$outer\" height=\"$outer\"/>|g" > $tile
inkscape --verb=EditSelectAllInAllLayers --verb=su-v/org.inkscape.effect.path.intersect --select="g$n" --verb=SelectionUnGroup --verb=FileSave --verb=FileQuit $tile
./minisvg.sh $tile > .tmp.svg
l=`grep -n rxyui12k .tmp.svg | sed -e "s/\([0-9]*\):.*/\1/g"`
l=$(($l-1))
head --lines $l .tmp.svg | sed -e "s/0 0 96 96/0 0 $outer $outer/g" > $tile
echo "</svg>" >> $tile
rm -f .tmp.svg 

done
done
