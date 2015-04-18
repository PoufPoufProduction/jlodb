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
                            '`User_Id`                  VARCHAR( 64 )   NOT NULL , '.
                            '`User_Password`            VARCHAR( 64 )   NOT NULL , '.
                            '`User_Code`                VARCHAR( 128) , '.
                            '`User_Avatar`              VARCHAR( 64 ) , '.
                            '`User_FirstName`           VARCHAR( 128) , '.
                            '`User_LastName`            VARCHAR( 128) , '.
                            '`User_eMail`               VARCHAR( 128) , '.
                            '`User_Stars`               INT DEFAULT 0 , '.
                            '`User_Theme`               VARCHAR( 128) , '.
                            '`User_Date`                DATETIME DEFAULT NULL, '.
                            'PRIMARY KEY (  `User_Id` ) ) ENGINE=InnoDB', $link);
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
            if (!$userStars) { mysql_query('ALTER TABLE `'.$_SESSION['prefix'].'user` '.
                                           'ADD `User_Stars` INT DEFAULT 0 AFTER `User_eMail`'); }
            if (!$userTheme) { mysql_query('ALTER TABLE `'.$_SESSION['prefix'].'user` '.
                                           'ADD `User_Theme` VARCHAR( 128) AFTER `User_Stars`'); }
        }
        else {
            $textstatus = "can not create `".$_SESSION['prefix']."user` table";
            $error = 13;
        }

        // ADD TEST USERS
        $avatars = array("U+IOHgggDZIDgqNgg8LLG","RJJCF7ggB2GG/qD/gFEED","VhGMCyggBACDVqM/IkLLE");
        for ($i=0; $i<10; $i++) {
            mysql_query("DELETE FROM `".$_SESSION['prefix']."user` WHERE `User_Id`='test".$i."'");
            mysql_query("INSERT INTO `".$_SESSION['prefix']."user` (`User_Id`, `User_Password`, `User_Avatar`) VALUES ".
                        "('test".$i."', '".md5("test".$i)."', '".$avatars[$i%count($avatars)]."')");
        }

    }
}

?>
