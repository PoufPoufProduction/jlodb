<?php


session_start();

if (!$apipath) { $apipath="./"; }
$filename   = $apipath."../../conf/jlodb.ini";
$status     = "success";
$error      = 0;
$textstatus = "";

if ( strlen($_GET["password"] ))
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
else { $_SESSION['User_DevMode'] = 0; }


// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "devmode": '.($_SESSION['User_DevMode']?'1':'0');
echo '}';


?> 
