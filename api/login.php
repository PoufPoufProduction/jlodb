<?php

include "_login.php";

$status     = "error";
$error      = 0;
$textstatus = "";

session_start();
login($_GET["username"], $_GET["password"], $status, $textstatus, $error);


// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
echo '}';

?>

