<?php
$forceReadFile = 1;
$apipath = "../../../api/";
include $apipath."database.php";
include $apipath."mods/builduser.php";

if (!$error) {

    // CHECK IF THE CALLER IS LOGGED AS ADMIN
    if (!$_SESSION['admin']) {
        $textstatus = "operation is not authorized";
        $error = 100;
    }
    else {
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."genius`")) {
            mysql_query('CREATE TABLE `'.$_SESSION['prefix'].'genius` ('.
                            '`User_Id` VARCHAR( 64 )  NOT NULL UNIQUE, `Genius` TEXT, PRIMARY KEY (  `User_Id` ) )', $link);
        }

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."state`")) {
            mysql_query('CREATE TABLE `'.$_SESSION['prefix'].'state` ('.
                            '`User_Id` VARCHAR( 64 ) NOT NULL, '.
                            '`Node_Id` VARCHAR( 64 ) NOT NULL, '.
                            '`State` TEXT, '.
                            ' PRIMARY KEY (  `User_Id`, `Node_Id` ) )', $link);
        }

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."group`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'group` ('.
                            '`Group_Name`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Id`                 VARCHAR( 64 ) NOT NULL, '.
                            '`Group_Index`             INT NOT NULL, '.
                            ' FOREIGN KEY ( `User_Id` ) REFERENCES `'.$_SESSION['prefix'].'user`(`User_Id`), '.
                            ' PRIMARY KEY ( `Group_Name`, `User_Id` ))', $link);
        }

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."friend`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'friend` ('.
                            '`User_Id`                  VARCHAR( 64 ) NOT NULL, '.
                            '`Friend_Id`                VARCHAR( 64 ) NOT NULL, '.
                            '`Host`                     VARCHAR( 64 ), '.
                            '`Group_Name`               VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin, '.
                            '`Timestamp`                TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, '.
                            '`Accept`                   BOOL DEFAULT false, '.
                            ' FOREIGN KEY ( `User_Id` )     REFERENCES `'.$_SESSION['prefix'].'user`(`User_Id`), '.
                            ' FOREIGN KEY ( `Group_Name` )  REFERENCES `'.$_SESSION['prefix'].'group`(`Group_Name`)'.
                                'ON UPDATE CASCADE, '.
                            ' PRIMARY KEY ( `User_Id`, `Friend_Id`, `Host` ))', $link);
        }

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."send`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'send` ('.
                            '`Send_Id`                  VARCHAR( 32 ) NOT NULL, '.
                            '`User_Id`                  VARCHAR( 64 ) NOT NULL, '.
                            '`Course_Name`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`Group_Name`               VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin, '.
                            '`Course_Label`             TEXT NOT NULL, '.
                            '`Timestamp`                TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, '.
                            '`Deadline`                 TIMESTAMP, '.
                            '`Finished`                 BOOL DEFAULT false, '.
                            ' FOREIGN KEY ( `User_Id` ) REFERENCES `'.$_SESSION['prefix'].'user`(`User_Id`), '.
                            ' PRIMARY KEY ( `Send_Id` ))', $link);
        }

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."recv`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'recv` ('.
                            '`Recv_Id`                  VARCHAR( 32 ) NOT NULL, '.
                            '`User_Id`                  VARCHAR( 64 ) NOT NULL, '.
                            '`Course_Description`       TEXT, '.
                            '`Masked`                   BOOL DEFAULT false, '.
                            ' FOREIGN KEY ( `User_Id` ) REFERENCES `'.$_SESSION['prefix'].'user`(`User_Id`), '.
                            ' FOREIGN KEY ( `Recv_Id` ) REFERENCES `'.$_SESSION['prefix'].'recv`(`Send_Id`), '.
                            ' PRIMARY KEY ( `Recv_Id`, `User_Id` ))', $link);
        }


        $status = "success";
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo $config;
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
echo '}';


?>
