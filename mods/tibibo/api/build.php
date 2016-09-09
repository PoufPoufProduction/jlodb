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
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."book`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'book` ('.
                            '`Book_Name`             VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`              INT NOT NULL, '.
                            '`Book_Label`            TEXT NOT NULL, '.
                            '`Book_Description`      TEXT NOT NULL, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Book_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Book_Name` )) ENGINE=InnoDB', $link);
        }

    
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."tibibo`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'tibibo` ('.
                            '`Book_Name`             VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`              INT NOT NULL, '.
                            '`Node_Id`               INT NOT NULL, '.
                            '`Node_State`            TEXT, '.
                            '`Node_Date`             DATETIME, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Tibibo_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Tibibo_Book_Name` FOREIGN KEY (`Book_Name`) REFERENCES `'.$_SESSION['prefix'].'book` '.
                            ' (`Book_Name`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Book_Name`, `User_Key`, `Node_Id` )) ENGINE=InnoDB', $link);
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
