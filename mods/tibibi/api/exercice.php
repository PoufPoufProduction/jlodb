<?php
$apipath = "../../../api/";
include $apipath."database.php";

if (!$error) {
    $ex = explode(",",$_GET["value"]);

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

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
echo '  "textStatus" : "'.$textstatus.'",';
if ($error)     { echo '  "error" : '.$error; }
else {
    echo '  "exercices": ['.$all.']';
}
echo '}';


?>
