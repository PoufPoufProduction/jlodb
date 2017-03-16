#!/bin/bash

if [ ! -f "index.html" ]; then
        echo `basename $0` must be run from the jlodb folder root
        exit 1
fi

username=johndoe
password=123456
host=127.0.0.1
dest=/

sshpass -p $password rsync -a --delete-after -e ssh . $username@$host:$dest
