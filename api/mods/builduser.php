<?php

if (!$error) {
    // CHECK IF THE CALLER IS LOGGED AS ADMIN
    if (!$_SESSION['admin']) {
        $textstatus = "operation is not authorized";
        $error = 100;
    }
    else {
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."user`")) {
            // CREATE THE TABLE
            mysql_query('CREATE TABLE `'.$_SESSION['prefix'].'user` ('.
                            '`User_Id`                  VARCHAR( 64 )   NOT NULL UNIQUE, '.
                            '`User_Password`            VARCHAR( 64 )   NOT NULL , '.
                            '`User_Avatar`              VARCHAR( 64 ) , '.
                            '`User_Code`                VARCHAR( 128) , '.
                            '`User_Date`                DATETIME DEFAULT NULL, '.
                            'PRIMARY KEY (  `User_Id` ) )', $link);
        }

        if (mysql_query("SELECT * FROM `".$_SESSION['prefix']."user`")) {
            // GET THE COLUMN NAMES
            $columns = mysql_query('SHOW COLUMNS FROM `'.$_SESSION['prefix'].'user`');
            while($row = mysql_fetch_array($columns)) {
                //echo $row[0];
            }
            // ADD COLUMNS
        }
        else {
            $textstatus = "can not create `".$_SESSION['prefix']."user` table";
            $error = 111;
        }

    }
}

?>
