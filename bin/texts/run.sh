#!/bin/sh

touch book

for file in *.txt ; do
	echo "++ Processing $file"
	./process.sh "$file" >> book
done

sort book > .tmp
mv .tmp book
