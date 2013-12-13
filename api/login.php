<?php
$filename   = "../conf/jlodb.ini";
$status     = "error";
$error      = 0;
$textstatus = "";

session_start();
$_SESSION['admin'] = false;

// CHECK IF THE CONFIGURATION FILE IS HERE
if (!file_exists($filename)) {
    $textstatus = "$filename: configuration file is missing";
    $error = 404;
}
else
{
    // EXPORT THE CONFIGURATION FILE
    $ini_array = parse_ini_file($filename, true);

    // CHECK THE LOGIN PARAMETERS
    if ( strcmp($ini_array["admin"]["username"], $_GET["username"]) == 0 &&
         strcmp($ini_array["admin"]["password"], md5($_GET["password"])) == 0 ) {
        $status = "success";
        $textstatus = "logged successfuly";
        $_SESSION['admin'] = true;
    }
    else {
        $error = 400;
        $textstatus = "wrong login";
    }

}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
echo '}';

?>

