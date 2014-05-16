<?php

$apipath = "../../../api/";
include $apipath."database.php";

if (!$error) {
    $course = 0;
    $a=mysql_query("SELECT count(*) FROM `".$_SESSION['prefix']."course");
    if ($a) { $course = 1; }

    $tibibi = file_exists("../../../tibibi.html")?1:0;

    $status = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
if ($overview)  { echo $overview.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "course" : '.$course.',';
echo '  "tibibi" : '.$tibibi.'';
echo '}';

?>
