#!/bin/bash

if [ ! -f "index.html" ]; then
        echo `basename $0` must be run from the jlodb folder root
        exit 1
fi

username=u45385613
password=Password421
host=home206714238.1and1-data.host
dest=content/jlodb/

sshpass -p $password rsync -av --delete-after --exclude-from=bin/synchroexclusion.txt -e ssh . $username@$host:$dest
