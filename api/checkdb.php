<?php
// $forceReadFile = true;
include_once "database.php";

if (!$error) {
    $result = mysql_query("SELECT * FROM `".$_SESSION['prefix']."jlodb` LIMIT 1");
    if ($result) {
        $row = mysql_fetch_array($result);

        $lock = false;
        if ($row["Lock"]) {
            $error = 4;
            $textstatus = "Database is locked";
            $lock = true;
        }
        else { $status = "success"; }

        $a=mysql_query("SELECT count(*) FROM `".$_SESSION['prefix']."activity`");
        $b=mysql_fetch_array($a);
        $a=mysql_query("SELECT count(*) FROM `".$_SESSION['prefix']."exercice`");
        $c=mysql_fetch_array($a);

        $overview = '"version":"'.$row["Version"].'", "date":"'.$row["Date"].'", "lang":"'.$row["Language"].
                    '", "activities":'.$b[0].', "exercices":'.$c[0].', "lock":'.($lock?"true":"false");

    }
    else {
        $textstatus = $_SESSION['prefix']."jlodb table is missing";
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
if ($overview)  { echo $overview.','; }
if ($_SESSION['url']) { echo ' "url" : "'.$_SESSION['url'].'",'; }
echo '  "textStatus" : "'.$textstatus.'"';
echo '}';

?>
