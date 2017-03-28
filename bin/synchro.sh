#!/bin/bash

conf="$HOME/.jlodb.conf"

if [ ! -f "index.html" ]; then
        echo `basename $0` must be run from the jlodb folder root
        exit 1
fi

if [ ! -f "$conf" ]; then
        echo "username=root" > $conf
        echo "password=123456" >> $conf
        echo "host=localhost" >> $conf
        echo "dest=content/jlodb/" >> $conf
        echo "Update configuration file $conf before synchronization"
        exit 1
fi

username=`grep username $conf | sed -e "s/username=//g"`
password=`grep password $conf | sed -e "s/password=//g"`
host=`grep host $conf | sed -e "s/host=//g"`
dest=`grep dest $conf | sed -e "s/dest=//g"`

sshpass -p $password rsync -av --delete-after --exclude-from=bin/synchroexclusion.txt -e ssh . $username@$host:$dest
