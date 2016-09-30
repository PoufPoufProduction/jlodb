<?php
$forceReadFile = 1; $apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/build.php";

if (!$error) {

    // CHECK IF THE CALLER IS LOGGED AS ADMIN
    if (!$_SESSION['admin']) {
        $textstatus = "operation is not authorized";
        $error = 100;
    }
    else {
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."file`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'file` ('.
                            '`File_Name`                VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`                 INT NOT NULL, '.
                            '`File_Label`               TEXT NOT NULL, '.
                            '`File_Description`         TEXT NOT NULL, '.
                            '`File_Level`               TEXT NOT NULL , '.
                            '`File_Classification`      VARCHAR( 64 )   NOT NULL , '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'File_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `File_Name` )) ENGINE=InnoDB', $link);
        }

        $status = "success";
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
echo '}';


?>
