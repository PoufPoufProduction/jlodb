#!/bin/bash


if [ "$#" -lt 1 ]; then
    echo "usage : `basename $0` epub_folder"
    exit 1
fi

echo "<?xml version='1.0' encoding='utf-8'?>"
echo "<package xmlns=\"http://www.idpf.org/2007/opf\" unique-identifier=\"uid\" version=\"2.0\">"
echo "<metadata xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:opf=\"http://www.idpf.org/2007/opf\" xmlns:dcterms=\"http://purl.org/dc/terms/\" xmlns:calibre=\"http://calibre.kovidgoyal.net/2009/metadata\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\">"
echo "  <dc:language>fr</dc:language>"
echo "  <dc:creator opf:file-as=\"poufpoufproduction\" opf:role=\"aut\">poufpoufproduction</dc:creator>"
echo "  <dc:title>Tibibo export</dc:title>"
echo "  <meta name=\"cover\" content=\"cover\"/>"
echo "  <dc:date>0101-01-01T00:00:00+00:00</dc:date>"
echo "  <dc:identifier id=\"uid\">urn:uuid:5a626fb5-f2a1-48b4-bced-4db638f379e8</dc:identifier>"
echo "</metadata>"

echo "<manifest>"

i=0
for f in `find $1 -depth` ; do
    if [ -f $f ] ; then
        filename=`echo $f | sed -e "s|$1/||g"`
        extension="${filename##*.}"
        fid=`basename $f .$extension`
        
        case "$extension" in
            "svg")      echo "  <item href=\"${filename}\" id=\"${fid}_${extension}_${i}\" media-type=\"image/svg+xml\"/>" ;;
            "js")       echo "  <item href=\"${filename}\" id=\"${fid}_${extension}\" media-type=\"application/javascript\"/>" ;;
            "html")     echo "  <item href=\"${filename}\" id=\"${fid}\" media-type=\"text/html\"/>" ;;
            "xhtml")    echo "  <item href=\"${filename}\" id=\"${fid}\" media-type=\"application/xhtml+xml\"/>" ;;
            "css")      echo "  <item href=\"${filename}\" id=\"${fid}_${extension}\" media-type=\"text/css\"/>" ;;
            "ncx")      echo "  <item href=\"${filename}\" id=\"${fid}\" media-type=\"application/x-dtbncx+xml\"/>" ;;
            *) ;;
        esac
        
        i=$((i+1))
    fi
done

echo "</manifest>"


# SPINE
echo '<spine toc="toc">'
for f in $1/page*.html; do
    echo '  <itemref idref="'`basename $f .html`'"/>'
done
echo '</spine>'

# GUIDE
echo '<guide>'
echo '  <reference href="page_001.html" title="Title" type="cover"/>'
echo '</guide>'

echo '</package>'
