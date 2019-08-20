#!/bin/bash
set -e

if [ ! -d ~/.poufpouf/firefox ] ; then mkdir -p ~/.poufpouf/firefox; fi

version=%version%
year=`echo $version | sed -e "s|\([^.]*\).*|\1|g"`
month=`echo $version | sed -e "s|${year}\.\([^.]*\).*|\1|g"`
patch=`echo $version | sed -e "s|${year}\.${month}\.\(.*\)$|\1|g"`
id=$(($year*10000+$month*100+$patch))
fill=0
filename=~/.poufpouf/VERSION

if [ -f $filename ] ; then
	oldid=`cat $filename`
    if [ $id -gt $oldid ] ; then
		echo $id > $filename
		fill=1
	fi
else
	echo $id > $filename
    fill=1
fi

if [ $fill -eq 1 ] ; then
	cp -rf /var/www/tibibo/%tibibo%/doc/* ~/.poufpouf/firefox/
fi

 
/usr/bin/firefox -profile ~/.poufpouf/firefox -new-window file:///var/www/tibibo/%tibibo%/index.html
