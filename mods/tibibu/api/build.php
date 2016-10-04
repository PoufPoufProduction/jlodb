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

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."message`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'message` ('.
                            '`Message_Key`              INT NOT NULL AUTO_INCREMENT, '.
                            '`User_Key`                 INT NOT NULL, '.
                            '`Circle_Key`               INT, '.
                            '`Target_Key`               INT, '.
                            '`Message_Type`             VARCHAR( 64 ) NOT NULL , '.
                            '`Message_Status`           VARCHAR( 64 ), '.
                            '`Message_Label`            VARCHAR( 64 ), '.
                            '`Message_Description`      TEXT, '.
                            '`Message_Content`          TEXT, '.
                            '`Message_Date`             TIMESTAMP DEFAULT CURRENT_TIMESTAMP, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Message_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Message_Key` )) ENGINE=InnoDB', $link);
        }

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."response`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'response` ('.
                            '`Response_Key`             INT NOT NULL AUTO_INCREMENT, '.
                            '`User_Key`                 INT NOT NULL, '.
                            '`Message_Key`              INT NOT NULL, '.
                            '`Response_Description`     TEXT, '.
                            '`Response_Content`         TEXT, '.
                            '`Response_Date`            TIMESTAMP DEFAULT CURRENT_TIMESTAMP, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Response_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Response_Message_Key` FOREIGN KEY (`Message_Key`) REFERENCES `'.$_SESSION['prefix'].'message` '.
                            ' (`Message_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Response_Key` )) ENGINE=InnoDB', $link);
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
