<?php

function exName($file, $key, $id, &$warnings)
{
    $ret = "";
    if (substr($id,0,1)=='_') { $ret = substr($id,1); }
    else {
        $subname = substr($file,0,2);
        if ($subname=="xx") {
            if (strlen($id)>2) { array_push($warnings, "(W) Can not insert exercice ".$id." as its length>2 in xx.rdf [".$key."]"); }
            else               { $ret = $key.$id; }
            
        }
        else { $ret = $key.$subname.$id; }
    }
    return $ret;
}

function mysqli_query_array($link, &$sql, &$id, &$warnings, $delete) {
    if ($delete) {
        mysqli_query($link, "DELETE FROM `".$_SESSION['prefix']."exercice` WHERE `Exercice_Id` IN (".implode(',',$id).")");
    }

    $init = "INSERT INTO `".$_SESSION['prefix']."exercice` (`Exercice_Id`,`Exercice_Activity`,".
                "`Exercice_Title`,`Exercice_Parameters`,`Exercice_Level`,`Exercice_Difficulty`,".
                "`Exercice_Classification`,`Exercice_Duration`,`Exercice_Tags`,`Exercice_Variant`,`Exercice_Base`,".
                "`Exercice_Reference`,`Exercice_Source`,`Exercice_Nb`) VALUES ";
    if (!mysqli_query($link, $init.implode(',',$sql))) {
        for ($i=0; $i<count($sql); $i++) {
            if (!mysqli_query($link, $init.$sql[$i])) {
                array_push($warnings, "(W) Can not insert exercice ".$id[$i]." : ".mysqli_error($link));
            }
        }
    }
    $sql = array(); $id=array(); 
}

function insertIntoDB($link,$activity,$key,$file,$lang,&$warnings, &$tags, $delete) {
    
    // ALLOW TIME FOR THIS OPERATION
    set_time_limit(60);
    
    // READ THE RDF FILE
    $rdf = file_get_contents("../data/".$activity."/".$file);
    $rdf = str_replace('rdf:','rdf_', $rdf);
    $rdf = str_replace('dct:','dct_', $rdf);
    $rdf = str_replace('xml:','xml_', $rdf);
    $xml = new SimpleXMLElement($rdf);
    $count = 0;
    $sql = array();
    $id  = array();
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
        $exerciceBase	= "";
        $exerciceTag    = "";
        $exerciceRef    = "";
        $exerciceSource = "";
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
                    if (strcmp($dcName,"dct_relation")==0)              { $exerciceBase     = $dc; } else
                    if (strcmp($dcName,"dct_isPartOf")==0)              { $exerciceRef      = $dc; } else
                    if (strcmp($dcName,"dct_source")==0)                { $exerciceSource   = $dc; } else
                    if (strcmp($dcName,"dct_coverage")==0 && strcmp($dc->attributes()->xml_lang, $lang)==0)
                                                                        { $exerciceTag      = $dc; }
            }
            $exerciceId = exName($file, $key, $exerciceId,$warnings);
            if (strlen($exerciceId)) {
                if (strlen($exerciceVar))  { $exerciceVar  = exName($file, $key, $exerciceVar,  $warnings); }
                if (strlen($exerciceBase)) { $exerciceBase = exName($file, $key, $exerciceBase, $warnings); }
                if ($exerciceVar == $exerciceId) { $exerciceVar =""; }
                if ($exerciceBase== $exerciceId) { $exerciceBase=""; }

                // FILL THE TABLE
                $exerciceTitle = str_replace("'", "\'", $exerciceTitle);
                $exerciceDesc = str_replace("'", "\'", $exerciceDesc);

                array_push($sql, "('".
                    $exerciceId."','".$activity."','".$exerciceTitle."','".$exerciceDesc."',".
                    $exerciceLevel.",".$exerciceDiff.",'".$exerciceClass."',".$exerciceTime.",'".
                    $exerciceTag."','".$exerciceVar."','".$exerciceBase."','".$exerciceRef."','".$exerciceSource."',0)");
                array_push($id, "'".$exerciceId."'");

                // HANDLE THE TAGS
                if ($exerciceTag) {
                    $ts = explode(",",$exerciceTag);
                    foreach ($ts as $v) { if (!in_array($v,$tags)) { array_push($tags,$v);} }
                }

                if (count($sql)>100) {  mysqli_query_array($link, $sql, $id, $warnings,$delete); }
            }
        }
        $count++;
    }
    if (count($sql)) {  mysqli_query_array($link, $sql, $id, $warnings,$delete); }
}

?> 
