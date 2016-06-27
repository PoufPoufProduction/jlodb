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

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."tibibi`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'tibibi` ('.
                            '`Tibibi_Name`             VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`                INT NOT NULL, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Tibibi_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Tibibi_Name`, `User_Key` )) ENGINE=InnoDB', $link);
        }

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."course`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'course` ('.
                            '`Course_Name`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`                 INT NOT NULL, '.
                            '`Course_Description`       TEXT NOT NULL, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Course_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Course_Name`, `User_Key` )) ENGINE=InnoDB', $link);
        }

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."coursebytibibi`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'coursebytibibi` ('.
                            '`Course_Name`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`Tibibi_Name`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`                 INT NOT NULL, '.
                            '`Link_Description`         TEXT NOT NULL, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'CBT_Course_Name` FOREIGN KEY (`Course_Name`) REFERENCES `'.$_SESSION['prefix'].'course` '.
                            ' (`Course_Name`) ON UPDATE CASCADE ON DELETE CASCADE,'.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'CBT_Tibibi` FOREIGN KEY (`Tibibi_Name`) REFERENCES `'.$_SESSION['prefix'].'tibibi` '.
                            ' (`Tibibi_Name`) ON UPDATE CASCADE ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Course_Name`, `Tibibi_Name`, `User_Key` )) ENGINE=InnoDB', $link);
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
