<?php

include "database.php";

if (!$error) {
    $result = mysql_query("SELECT * FROM `".$_SESSION['prefix']."jlodb` LIMIT 1");
    $row = mysql_fetch_array($result);

    if ($row["Lock"]) {
        $error = 403;
        $textstatus = "Database is locked";
    }
    else {
        $a=mysql_query("SELECT count(*) FROM `".$_SESSION['prefix']."activity`");
        $b=mysql_fetch_array($a);
        $a=mysql_query("SELECT count(*) FROM `".$_SESSION['prefix']."exercice`");
        $c=mysql_fetch_array($a);

        $status = "success";
        $overview = '"version":"'.$row["Version"].'", "date":"'.$row["Date"].'", "lang":"'.$row["Language"].
                    '", "activities":'.$b[0].', "exercices":'.$c[0];
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
if ($overview)  { echo $overview.','; }
echo '  "textStatus" : "'.$textstatus.'"';
echo '}';

?>