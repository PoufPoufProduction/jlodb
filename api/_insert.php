<?php

function exName($file, $key, $id)
{
    $ret = "";
    if (substr($id,0,1)=='_') { $ret = substr($id,1); }
    else {
        $subname = substr($file,0,2);
        if ($subname=="xx") { $subname=""; }
        $ret = $key.$subname.$id;
    }
    return $ret;
}

function insertIntoDB($link,$activity,$key,$file,$lang,&$warnings, &$tags) {
    // READ THE RDF FILE
    $rdf = file_get_contents("../data/".$activity."/".$file);
    $rdf = str_replace('rdf:','rdf_', $rdf);
    $rdf = str_replace('dct:','dct_', $rdf);
    $rdf = str_replace('xml:','xml_', $rdf);
    $xml = new SimpleXMLElement($rdf);
    $count = 0;
    // PARSE THE ACTIVITIES RDF FILE FOR FILLING THE ACTIVITY TABLE
    foreach ($xml->children() as $childName=>$child) {
        $exerciceTitle  = "";
        $exerciceDesc   = "";
        $exerciceLevel  = 0;
        $exerciceDiff   = 0;
        $exerciceClass  = "None";
        $exerciceTime   = 60;
        $exerciceId     = "";
        $exerciceVar    = "";
        $exerciceTag    = "";
        $exerciceRef    = "";
        if (strcmp($childName,"rdf_Description")==0) {
            foreach ($child->children() as $dcName=>$dc) {
                if (strcmp($dcName,"dct_title")==0) {
                    if (!$dc->attributes()->xml_lang && !$exerciceTitle){ $exerciceTitle    =$dc; }
                    if (strcmp($dc->attributes()->xml_lang, $lang)==0)  { $exerciceTitle    =$dc; }
                } else
                if (strcmp($dcName,"dct_description")==0) {
                    if (!$dc->attributes()->xml_lang)                   { $exerciceDesc    .=$dc; }
                    if (strcmp($dc->attributes()->xml_lang, $lang)==0)  { $exerciceDesc    .=$dc; }
                } else
                    if (strcmp($dcName,"dct_extent")==0)                { $exerciceTime     = $dc; }  else
                    if (strcmp($dcName,"dct_subject")==0)               { $exerciceClass    = $dc; } else
                    if (strcmp($dcName,"dct_educationLevel")==0)        { $exerciceLevel    = $dc; } else
                    if (strcmp($dcName,"dct_type")==0)                  { $exerciceDiff     = $dc; } else
                    if (strcmp($dcName,"dct_identifier")==0)            { $exerciceId       = $dc; } else
                    if (strcmp($dcName,"dct_alternative")==0)           { $exerciceVar      = $dc; } else
                    if (strcmp($dcName,"dct_isPartOf")==0)              { $exerciceRef      = $dc; } else
                if (strcmp($dcName,"dct_coverage")==0 && strcmp($dc->attributes()->xml_lang, $lang)==0)
                                                                        { $exerciceTag      = $dc; }
            }
            $exerciceId = exName($file, $key, $exerciceId);
            if ($exerciceVar) { $exerciceVar = exName($file, $key, $exerciceVar); }
            if ($exerciceVar == $exerciceId) { $exerciceVar =""; }

            // FILL THE TABLE
            $exerciceTitle = str_replace("'", "\'", $exerciceTitle);
            $exerciceDesc = str_replace("'", "\'", $exerciceDesc);

            $sql = "INSERT INTO `".$_SESSION['prefix']."exercice` (`Exercice_Id`,`Exercice_Activity`,".
                "`Exercice_Title`,`Exercice_Parameters`,`Exercice_Level`,`Exercice_Difficulty`,".
                "`Exercice_Classification`,`Exercice_Duration`,`Exercice_Tags`,`Exercice_Variant`,".
                "`Exercice_Reference`,`Exercice_Nb`) VALUES ('".
                $exerciceId."','".$activity."','".$exerciceTitle."','".$exerciceDesc."',".
                $exerciceLevel.",".$exerciceDiff.",'".$exerciceClass."',".$exerciceTime.",'".
                $exerciceTag."','".$exerciceVar."','".$exerciceRef."',0) ".

                "ON DUPLICATE KEY UPDATE `Exercice_Title`='".$exerciceTitle."', `Exercice_Parameters`='".$exerciceDesc."', ".
                "`Exercice_Level`='".$exerciceLevel."', `Exercice_Difficulty`='".$exerciceDiff."', ".
                "`Exercice_Classification`='".$exerciceClass."', `Exercice_Duration`='".$exerciceTime."', ".
                "`Exercice_Tags`='".$exerciceTag."', `Exercice_Variant`='".$exerciceVar."', ".
                "`Exercice_Reference`='".$exerciceRef."'";

            if (!mysql_query($sql , $link)) {
                array_push($warnings, "(W) Can not insert #".$count." exercice [".$exerciceId."] from ".$file." for activity ".$activity);
            }

            // HANDLE THE TAGS
            if ($exerciceTag) {
                $ts = explode(",",$exerciceTag);
                foreach ($ts as $v) { if (!in_array($v,$tags)) { array_push($tags,$v);} }
            }
        }
        $count++;
    }
}

?> 
