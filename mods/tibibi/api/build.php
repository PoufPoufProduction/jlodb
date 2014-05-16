<?php
$forceReadFile = 1;
$apipath = "../../../api/";
include_once $apipath."database.php";
include $apipath."mods/builduser.php";

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
                            '`User_Id`                 VARCHAR( 64 ) NOT NULL, '.
                        ' FOREIGN KEY ( `User_Id` )     REFERENCES `'.$_SESSION['prefix'].'user`(`User_Id`), '.
                        ' PRIMARY KEY ( `Tibibi_Name`, `User_Id` ))', $link);
        }

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."course`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'course` ('.
                            '`Course_Name`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Id`                  VARCHAR( 64 ) NOT NULL, '.
                            '`Course_Description`       TEXT NOT NULL, '.
                        ' FOREIGN KEY ( `User_Id` )     REFERENCES `'.$_SESSION['prefix'].'user`(`User_Id`), '.
                        ' PRIMARY KEY ( `Course_Name`, `User_Id` ))', $link);
        }

        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."coursebytibibi`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'coursebytibibi` ('.
                            '`Course_Name`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`Tibibi_Name`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Id`                  VARCHAR( 64 ) NOT NULL, '.
                            '`Link_Description`         TEXT NOT NULL, '.
                        ' FOREIGN KEY ( `Course_Name` ) REFERENCES `'.$_SESSION['prefix'].'course`(`Course_Name`), '.
                        ' FOREIGN KEY ( `Tibibi_Name` ) REFERENCES `'.$_SESSION['prefix'].'tibibi`(`Tibibi_Name`), '.
                        ' FOREIGN KEY ( `User_Id` )     REFERENCES `'.$_SESSION['prefix'].'user`(`User_Id`), '.
                        ' PRIMARY KEY ( `Course_Name`, `Tibibi_Name`, `User_Id` ))', $link);
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
