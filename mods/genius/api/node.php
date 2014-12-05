<?php
$apipath = "../../../api/";
include $apipath."database.php";

if (!$error) {

    if ($_GET["id"]) {
        $node = mysql_query("SELECT * FROM `".$_SESSION['prefix']."node` WHERE Node_Id=".$_GET["id"]." LIMIT 1");


        $row = $node?mysql_fetch_array($node):0;
        if ($row) {
            // MISC
            $name       = $row["Node_Title"];
            $abstract   = $row["Node_Description"];
            $subject    = $row["Node_Subject"];
            $exercices  = $row["Node_Exercices"];

            if ($_GET["verbose"]) {
                $ex = explode(",",$exercices);

                $all="";
                foreach ($ex as $exid) {
                    $detail = mysql_query("SELECT * FROM `".$_SESSION['prefix']."exercice` WHERE `Exercice_Id` = '".$exid."'");
                    $d = $detail?mysql_fetch_array($detail):0;
                    if (strlen($all)) { $all.=","; }
                    $all.='{ "id": "'.$exid.'",';
                    if ($d) {
                        $all.=' "title": "'.$d["Exercice_Title"].'",';
                        $all.=' "level": "'.$d["Exercice_Level"].'",';
                        $all.=' "difficulty": "'.$d["Exercice_Difficulty"].'"}';
                    }
                    else {
                        $all.=' "title": "EXERCICE ERROR"}';
                    }
                }
            }

            $status     = "success";
        }
        else {
            $error = 404;
            $textstatus = "can not find node";
        }

    } else {
        $status = "error";
        $error = 100;
        $textstatus = "node id is missing";
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
echo '  "textStatus" : "'.$textstatus.'",';
if ($error)     { echo '  "error" : '.$error; } else {
echo '  "id": "'.$_GET["id"].'",';
echo '  "name": "'.$name.'",';
echo '  "lang": "'.$_SESSION['lang'].'",';
echo '  "abstract": "'.$abstract.'",';
echo '  "subject": "'.$subject.'",';
echo '  "exercices": "'.$exercices.'"';
if ($_GET["verbose"]) {
    echo ',  "detail": ['.$all.']';
}
}
echo '}';

?> 
