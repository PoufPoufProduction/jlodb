<?php
$forceReadFile = 1; $apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/builduser.php";

if (!$error) {

    // CHECK IF THE CALLER IS LOGGED AS ADMIN
    if (!$_SESSION['admin']) {
        $textstatus = "operation is not authorized";
        $error = 100;
    }
    else {
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."book`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'book` ('.
                            '`Book_Name`             VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`              INT NOT NULL, '.
                            '`Book_Label`            TEXT NOT NULL, '.
                            '`Book_Description`      TEXT NOT NULL, '.
                            ' CONSTRAINT `fr_Book_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Book_Name` )) ENGINE=InnoDB', $link);
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
