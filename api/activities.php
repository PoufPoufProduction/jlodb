<?php

include "database.php";

if (!$error) {
    $activity = mysql_query("SELECT * FROM `".$_SESSION['prefix']."activity`");
    $json = "";
    while($row = mysql_fetch_array($activity)) {
        if (strlen($json)) { $json.=","; }
        $json.='{ "id":"'.$row["Activity_Name"].'","name":"'.$row["Activity_Name"].'","label":"'.$row["Activity_Title"].'",'.
               '"description":"'.$row["Activity_Description"].'"}';
    }
    $status     = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "activities" : ['.$json.']';
echo '}';

?>
