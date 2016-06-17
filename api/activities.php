<?php

include "database.php";

if (!$error) {
    $activity = mysql_query("SELECT * FROM `".$_SESSION['prefix']."activity`");
    $json = "";
    while($row = mysql_fetch_array($activity)) {
        if (strlen($json)) { $json.=","; }
        if ($_GET["locale"]) {
            $json.='"'.$row["Activity_Name"].'":{'.$row["Activity_Locale"].'}';
        }
        else {
            $json.='{ "id":"'.$row["Activity_Name"].'","name":"'.$row["Activity_Name"].'","label":"'.$row["Activity_Title"].'",'.
               '"description":"'.$row["Activity_Description"].'"}';
        }
    }
    $status     = "success";
}


if ($_GET["format"] && $_GET["format"]=="html") {
    echo '<!DOCTYPE HTML><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr" lang="fr">';
    echo '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>activities</title></head>';
    echo '<body>'.$json.'</body></html>';
}
else {
    // PUBLISH DATA UNDER JSON FORMAT
    echo '{';
    echo '  "status" : "'.$status.'",';
    if ($error)     { echo '  "error" : '.$error.','; }
    echo '  "textStatus" : "'.$textstatus.'",';
    if ($_GET["locale"]) { echo '  "locale" : {'.$json.'}'; } else { echo '  "activities" : ['.$json.']'; }
    echo '}';
}

?>
