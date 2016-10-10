#!/bin/sh

#very easy
#ex='su44v4 su44t7 su44d4 su44c3 su44t6 su43h3 su43d4 su42d8 su42d7 su42h3 su42d4 su42c5 su42c4 su42d5 su42c3 su42d6 su41d4 su41c4 su40d10 su40d8 su40c1 su40t6 su40d9 su40v4 su40d7 su40c7 su40d6 su40c5 su40d5 su40c6 su40d4 su40t7 su40c4 su39c4 su35d6 su35c6 su35d5 su35c5 su35h4 su35c4 su35d4 su35c1 su34d4 su33h4 su33t7 su33d4 su33t6 su32c4 su31d4 su31c4'
#easy
#ex='su44t2 su44h1 su43v2 su43d2 su41v3 su41h1 su41d1 su40v1 su40h1 su40d2 su39c1 su38d2 su37d3 su36v2 su36v1 su36t9 su36t8 su36h2 su36d3 su36d1 su36c1 su35v1 su35c3 su34d6 su34d5 su34c2 su33t8 su33d1 su32v4 su32t11 su32t10 su32h5 su32h4 su32d5 su32d4 su32c6 su32c5 su31v5 su31v4 su31h5 su31h4 su31d5 su31c5 su30v4 su30h5 su30h4 su30d5 su30d4 su30c5 su30c4'
#medium
#ex='su44t3 su44d1 su43d3 su42c1 su41t3 su40t5 su40t1 su39h1 su39d2 su38d1 su37t3 su37t1 su36t3 su36c2 su36t2 su36t1 su35v3 su35h1 su35c2 su34h2 su34d2 su34c1 su33v3 su33t3 su33t2 su33t1 su32v3 su32t9 su32t6 su32t2 su31d2 su31c3 su31c1 su30v1 su30h3 su30d3 su30d1 su30c3 su29v1 su29t3 su29t2 su29c1 su28t9 su28t8 su28c3 su26c3 su25c1 su24v2 su23c2 su24t2'
#hard
#ex='su44t1 su41t2 su40t4 su39d1 su38h3 su37t2 su35d3 su33t4 su32t5 su31d1 su30c1 su29t1 su29c2 su29d1 su28t7 su28t6 su28t1 su27d1 su27c1 su27d2 su26d2 su26c1 su25t1 su25t2 su25c3 su25t3 su25t4 su24t8 su24d1 su24t7 su24t5 su24t4 su23h1 su23v2 su23d1 su22v2 su22h2 su22d3 su22d1 su22c3 su22c2 su22c1 su21v1 su21t3 su21t2 su21d4 su21d3 su21c3 su20t2 su18d1'
# fiendish
ex='su29t6 su29t5 su29t4 su29d3 su28d3 su27v1 su27d4 su27d3 su27c3 su27c2 su26v4 su26h3 su26h1 su26d3 su26d1 su26c2 su25v1 su25t5 su25h4 su25d3 su25d2 su25d1 su24t9 su24t6 su24t3 su24t1 su24h2 su24h1 su24d3 su24d2 su24c3 su24c2 su23v3 su23h4 su23v1 su23d3 su23d2 su23c3 su23c1 su22v3 su22h3 su22h1 su22d2 su21v2 su21t1 su21d2 su21d1 su21c2 su21c1 su20t1'

for e in $ex; do

    f=`echo $e | sed -e 's/su\(..\)\(.*\)/grep -A 2 identifier\>\2 \1o.rdf/g'`

echo "\paragraph{{\large Niveau expert}}\mbox{} \\\\\\"
echo "\\\begin{tikzpicture}[scale=1.7]"
echo " \\\begin{scope}"
echo "  \\\draw (0, 0) grid (9, 9);"
echo "  \\\draw[very thick, scale=3] (0, 0) grid (3, 3);"
echo "  \\\setcounter{row}{1}"
echo
$f | grep description | sed -e 's/.*data":"\(.*\)".*/\1/g' -e 's/[abcdefghi]/ /g' -e 's/\(.\)/\{\1\}/g' -e 's/\(.\{27\}\)/  \\setrow \1\n/g'

echo " \\\end{scope}"
echo "\\\end{tikzpicture}"

echo "\\\newpage"
echo
echo

done
