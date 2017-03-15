<?php

session_start();

if (!isset($apipath)) { $apipath="./"; }
$filename   = $apipath."../../conf/jlodb.ini";
$status     = "success";
$error      = 0;
$textstatus = "";
$_SESSION['User_DevMode'] = 0;

if ( array_key_exists("password",$_GET))
{
    if (!file_exists($filename)) {
        $textstatus = "$filename: configuration file is missing";
        $error      = 1;
        $status     = "error";
    }
    else {
        $ini_array = parse_ini_file($filename, true);

        if (strcmp($ini_array["dev"]["password"],md5($_GET["password"]))==0) { $_SESSION['User_DevMode'] = 1; }
        else { $_SESSION['User_DevMode'] = 0; }

    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($textStatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }

echo '  "devmode": '.($_SESSION['User_DevMode']?'1':'0').',';
echo '  "from" : "user/api" }';


?> 
