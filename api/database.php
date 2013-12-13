<?php

/**
 *   Get the database parameters and create it if necessary
 *   (Of course the database is NOT removed)
 *   $error = 0 when the database is available at the end of the call
 **/

if (!$apipath) { $apipath="./"; }
$filename   = $apipath."../conf/jlodb.ini";
$status     = "error";
$error      = 0;
$textstatus = "";

session_start();

if (!$_SESSION['database'] || $forceReadFile ) {
    if (!file_exists($filename)) {
        $textstatus = "$filename: configuration file is missing";
        $error = 404;
    }
    else {
         // GET THE CONFIGURATION FILE
        $ini_array = parse_ini_file($filename, true);
        $_SESSION['database']   = $ini_array["db"]["database"];
        $_SESSION['prefix']     = $ini_array["db"]["prefix"];
        $_SESSION['host']       = $ini_array["db"]["host"];
        $_SESSION['username']   = $ini_array["db"]["username"];
        $_SESSION['password']   = $ini_array["db"]["password"];
    }
}

// CONNECT TO THE DATABASE
$link = @mysql_connect($_SESSION['host'], $_SESSION['username'], $_SESSION['password']);
if (!$link) {
    $textstatus = mysql_error();
    $error = 503;
}
else {
    // CONNECT TO THE DATABASE. CREATE IT IF NECESSARY
    $db = @mysql_select_db($_SESSION['database'], $link);
    if (!$db) {
        $sql = 'CREATE DATABASE '.$_SESSION['database'];
        if (mysql_query($sql, $link)) { $db = @mysql_select_db($_SESSION['database'], $link); }
    }

    // CHECK THE DATABASE
    if (!$db) {
        $textstatus = mysql_error();
        $error = 503;
    }
    else {
        // GET THE LANG
        if (!$_SESSION['lang']) {
            $jlodb = mysql_query("SELECT * FROM `".$_SESSION['prefix']."jlodb` LIMIT 1");
            if ($jlodb) {
                $row = mysql_fetch_array($jlodb);
                $_SESSION['lang'] = $row["Language"];
            }
        }
    }
}

?> 
