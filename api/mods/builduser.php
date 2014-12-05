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
                            '`User_Code`                VARCHAR( 128) , '.
                            '`User_Avatar`              VARCHAR( 64 ) , '.
                            '`User_FirstName`           VARCHAR( 128) , '.
                            '`User_LastName`            VARCHAR( 128) , '.
                            '`User_eMail`               VARCHAR( 128) , '.
                            '`User_Stars`               INT DEFAULT 0 , '.
                            '`User_Theme`               VARCHAR( 128) , '.
                            '`User_Date`                DATETIME DEFAULT NULL, '.
                            'PRIMARY KEY (  `User_Id` ) )', $link);
        }

        // UPDATE COLUMN WITHOUT DELETING TABLE
        if (mysql_query("SELECT * FROM `".$_SESSION['prefix']."user`")) {
            // GET THE COLUMN NAMES
            $userStars = false;
            $userTheme = false;
            $columns = mysql_query('SHOW COLUMNS FROM `'.$_SESSION['prefix'].'user`');
            while($row = mysql_fetch_array($columns)) {
                if ($row[0]=="User_Stars") { $userStars = true; }
                if ($row[0]=="User_Theme") { $userTheme = true; }
            }
            // ADD COLUMNS
            if (!$userStars) { mysql_query('ALTER TABLE `'.$_SESSION['prefix'].'user` ADD `User_Stars` INT DEFAULT 0 AFTER `User_eMail`'); }
            if (!$userTheme) { mysql_query('ALTER TABLE `'.$_SESSION['prefix'].'user` ADD `User_Theme` VARCHAR( 128) AFTER `User_Stars`'); }
        }
        else {
            $textstatus = "can not create `".$_SESSION['prefix']."user` table";
            $error = 13;
        }

        if (!mysql_query("DROP PROCEDURE IF EXISTS p") ||
    !mysql_query("CREATE PROCEDURE p(IN id_val INT) BEGIN INSERT INTO test(id) VALUES(id_val); END;")) {
    echo "Echec lors de la création de la procédure stockée : (" . $mysqli->errno . ") " . $mysqli->error;
}


    }
}

?>
