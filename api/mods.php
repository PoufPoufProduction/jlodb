<?php
$status     = "success";
$error      = 0;
$textstatus = "";
$json = "";

if ($handle = opendir("../mods")) {
    while (false !== ($file = readdir($handle))) {
        if ($file != "." && $file != "..") {

            $modrdf = "../mods/".$file."/".$file.".rdf";
            if (file_exists($modrdf)) {
                // READ THE RDF FILE
                $rdf = file_get_contents($modrdf);
                $rdf = str_replace('rdf:','rdf_', $rdf);
                $rdf = str_replace('dct:','dct_', $rdf);
                $rdf = str_replace('xml:','xml_', $rdf);
                $xml = new SimpleXMLElement($rdf);

                $name="";
                $abstract="";
                $requires="";
                $source="";

                // PARSE THE ACTIVITIES RDF FILE FOR FILLING THE ACTIVITY TABLE
                foreach ($xml->children()->children() as $childName=>$child) {
                    if (strcmp($childName,"dct_title")==0)         { $name=$child; }
                    if (strcmp($childName,"dct_abstract")==0)      { $abstract=$child; }
                    if (strcmp($childName,"dct_requires")==0)      { $requires=$child; }
                    if (strcmp($childName,"dct_source")==0)        { $source=$child; }
                }
 
                if (strlen($json)) { $json.=","; }
                $json.='{"id" :"'.$file.'", "name" :"'.$name.'", "abstract" :"'.$abstract.
                       '", "requires" :"'.$requires.'", "source" : "'.$source.'"}';
            }
        }
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo $config;
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "mods" :['.$json.']';
echo '}';


?> 
