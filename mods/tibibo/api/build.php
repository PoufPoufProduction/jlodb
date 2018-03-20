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
        if (!mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."book`")) {
            mysqli_query($link, 'CREATE TABLE  `'.$_SESSION['prefix'].'book` ('.
                            '`Book_Name`             VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`              INT NOT NULL, '.
                            '`Book_Label`            TEXT NOT NULL, '.
                            '`Book_Comment`          TEXT, '.
                            '`Book_Awards`           TEXT, '.
                            '`Book_Description`      TEXT NOT NULL, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Book_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON UPDATE CASCADE ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Book_Name` )) ENGINE=InnoDB');
        }
        
        $columns = mysqli_query($link, 'SHOW COLUMNS FROM `'.$_SESSION['prefix'].'book`');
        $bookComment = false;
        $bookAwards = false;
        while($row = mysqli_fetch_array($columns)) {
            if ($row[0]=="Book_Comment") { $bookComment = true; } else
            if ($row[0]=="Book_Awards")  { $bookAwards = true; }
        }
        if (!$bookComment) { mysqli_query($link, 'ALTER TABLE `'.$_SESSION['prefix'].'book` ADD `Book_Comment` TEXT AFTER `Book_Label`'); }
        if (!$bookAwards) { mysqli_query($link, 'ALTER TABLE `'.$_SESSION['prefix'].'book` ADD `Book_Awards` TEXT AFTER `Book_Comment`'); }

    
        if (!mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."tibibo`")) {
            mysqli_query($link, 'CREATE TABLE  `'.$_SESSION['prefix'].'tibibo` ('.
                            '`Book_Name`             VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`              INT NOT NULL, '.
                            '`Node_Id`               INT NOT NULL, '.
                            '`Node_State`            TEXT, '.
                            '`Node_Date`             DATETIME, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Tibibo_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON UPDATE CASCADE ON DELETE CASCADE,'.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Tibibo_Book_Name` FOREIGN KEY (`Book_Name`) REFERENCES `'.$_SESSION['prefix'].'book` '.
                            ' (`Book_Name`) ON UPDATE CASCADE ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Book_Name`, `User_Key`, `Node_Id` )) ENGINE=InnoDB');
        }

        $status = "success";
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && ($error))  { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
echo '  "from" : "mods/tibibo/api" }';



?>
