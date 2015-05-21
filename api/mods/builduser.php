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
                            '`User_Days`                INT DEFAULT 1 , '.
                            '`User_Date`                DATETIME DEFAULT NULL, '.
                            'PRIMARY KEY (  `User_Id` ) ) ENGINE=InnoDB', $link);
        }

        // UPDATE COLUMN WITHOUT DELETING TABLE
        if (mysql_query("SELECT * FROM `".$_SESSION['prefix']."user`")) {
            // GET THE COLUMN NAMES
            $userStars = false;
            $userTheme = false;
            $userDays = false;
            $columns = mysql_query('SHOW COLUMNS FROM `'.$_SESSION['prefix'].'user`');
            while($row = mysql_fetch_array($columns)) {
                if ($row[0]=="User_Stars") { $userStars = true; }
                if ($row[0]=="User_Theme") { $userTheme = true; }
                if ($row[0]=="User_Days") { $userDays = true; }
            }
            // ADD COLUMNS
            if (!$userStars) { mysql_query('ALTER TABLE `'.$_SESSION['prefix'].'user` '.
                                           'ADD `User_Stars` INT DEFAULT 0 AFTER `User_eMail`'); }
            if (!$userTheme) { mysql_query('ALTER TABLE `'.$_SESSION['prefix'].'user` '.
                                           'ADD `User_Theme` VARCHAR( 128) AFTER `User_Stars`'); }
            if (!$userDays) { mysql_query('ALTER TABLE `'.$_SESSION['prefix'].'user` '.
                                           'ADD `User_Days` INT DEFAULT 1 AFTER `User_Theme`'); }
        }
        else {
            $textstatus = "can not create `".$_SESSION['prefix']."user` table";
            $error = 13;
        }

        // ADD TEST USERS
        $avatars = array("U+IOHgggDZIDgqNgg8LLG","RJJCF7ggB2GG/qD/gFEED","VhGMCyggBACDVqM/IkLLE","PZCIEjggEXCNdqAVgzKKI");
        $firsnames = array("Bob","Sue","Roger","Mary","Rick","Amy","Paul","Michelle","Vladimir","Anna","Richard","Charlotte","John","Elizabeth","Oliver","Josephine");
        $lastname = array("ma","mi","mu","mo","pa","pi","pu","po","ta","ti","tu","to","man","min","mun","mon","pan","pin","pun","pon","tan","tin","tun","ton","ra","ri","ru","ro","ran","rin","run","ron");
        for ($i=0; $i<50; $i++) {
            $ln=$lastname[($i*7)%count($lastname)].$lastname[(floor($i/3)*5)%count($lastname)].$lastname[($i*11)%count($lastname)];
            mysql_query("DELETE FROM `".$_SESSION['prefix']."user` WHERE `User_Id`='test".$i."'");
            mysql_query("INSERT INTO `".$_SESSION['prefix']."user` ".
                        "(`User_Id`, `User_Password`, `User_Avatar`, `User_FirstName`, `User_LastName`) VALUES ".
                        "('test".$i."', '".md5("test".$i)."', '".$avatars[$i%count($avatars)]."', ".
                        "'".$firsnames[$i%count($firsnames)]."', '".ucfirst($ln)."')");
        }

    }
}

?>
