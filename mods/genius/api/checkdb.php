<?php
$apipath = "../../../api/";
include $apipath."database.php";

if (!$error) {
        $a=mysql_query("SELECT count(*) FROM `".$_SESSION['prefix']."node");
        if ($a) {
            $b=mysql_fetch_array($a);
            $status = "success";
            $overview = '"nodes":'.$b[0];
        }
        else { $textstatus=$_SESSION['prefix']."node table is missing"; $error=7;}
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
if ($overview)  { echo $overview.','; }
echo '  "textStatus" : "'.$textstatus.'"';
echo '}';

?>
