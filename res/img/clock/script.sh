#!/bin/sh
for h in $(seq 0 11); do 
for m in $(seq 0 11); do
tmp=`echo "$m*5" | bc`
am=`echo "$m*30" | bc`
#ah=`echo "$h*30+$m*2.5" | bc`
ah=`echo "$h*30" | bc`
if [ $tmp -lt 10 ]
then
mm="0$tmp"
else
mm=$tmp
fi
if [ $h -lt 10 ]
then
hh="0$h"
else
hh=$h
fi


head --lines 32 raw1.svg > clockB$hh$mm.svg

sed -e "s/rotate(45)/rotate($am)/g" minute.svg >> clockB$hh$mm.svg
sed -e "s/rotate(45)/rotate($ah)/g" hour.svg >> clockB$hh$mm.svg

echo "</svg>" >> clockB$hh$mm.svg


done
done
