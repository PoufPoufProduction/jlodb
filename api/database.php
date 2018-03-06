<?php

/**
 *   Get the database parameters and create it if necessary
 *   (Of course the database is NOT removed)
 *   $error = 0 when the database is available at the end of the call
 **/

if (!isset($apipath)) { $apipath="./"; }
$filename   = $apipath."../conf/jlodb.ini";

$status     = "error";
$error      = 0;
$textstatus = "";

session_start();

if ( !array_key_exists("database",$_SESSION) || (isset($forceReadFile)&&$forceReadFile))  {
    if (!file_exists($filename)) {
        $textstatus = "$filename: configuration file is missing";
        $error = 1;
    }
    else {
        // GET THE CONFIGURATION FILE
        $ini_array = parse_ini_file($filename, true);
        $_SESSION['database']   = $ini_array["db"]["database"];
        $_SESSION['prefix']     = $ini_array["db"]["prefix"];
        $_SESSION['host']       = $ini_array["db"]["host"];
        $_SESSION['username']   = $ini_array["db"]["username"];
        $_SESSION['password']   = $ini_array["db"]["password"];
        $_SESSION['url']        = $ini_array["dev"]["url"];
		
		date_default_timezone_set('UTC');
    }
}

// CONNECT TO THE DATABASE
$link = @mysqli_connect($_SESSION['host'], $_SESSION['username'], $_SESSION['password']);
if (!$link) {
    $textstatus = mysqli_error($link);
    $error = 2;
}
else {
    // CONNECT TO THE DATABASE. CREATE IT IF NECESSARY
    $db = @mysqli_select_db($link, $_SESSION['database']);
    if (!$db) {
        $sql = 'CREATE DATABASE '.$_SESSION['database'];
        if (mysqli_query($link, $sql)) { $db = @mysqli_select_db($_SESSION['database'], $link); }
    }

    // CHECK THE DATABASE
    if (!$db) {
        $textstatus = mysqli_error($link);
        $error = 3;
    }
    else {
        // GET THE LANG
        if (!array_key_exists("lang",$_SESSION)) {
            $jlodb = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."jlodb` LIMIT 1");
            if ($jlodb) {
                $row = mysqli_fetch_array($jlodb);
                $_SESSION['lang'] = $row["Language"];
            }
        }
    }
}

session_write_close();

?> 
