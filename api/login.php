<?php

$rc = session_start();

include "_login.php";

$status     = "error";
$error      = 0;
$textstatus = "";

$username = "";
$password = "";
if (array_key_exists("username",$_GET)) { $username = $_GET["username"]; }
if (array_key_exists("password",$_GET)) { $password = $_GET["password"]; }

login($username, $password, $status, $textstatus, $error);

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))             			{ echo '  "status" : "'.$status.'"'; }
if (isset($error) && $error)    			{ echo ',  "error" : '.$error.''; }
if (isset($textstatus))         			{ echo ',  "textStatus" : "'.$textstatus.'"'; }
echo ', "session" : "'.$rc.'"';
echo ',  "from" : "jlodb/api" }';

?>

