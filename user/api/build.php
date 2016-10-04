<?php
include "_new.php";

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
                            '`User_Key`                 INT NOT NULL AUTO_INCREMENT, '.
                            '`User_Id`                  VARCHAR( 64 )   NOT NULL , '.
                            '`User_Password`            VARCHAR( 64 )   NOT NULL , '.
                            '`User_Tag`                 INT NOT NULL DEFAULT 1234, '.
                            '`User_Code`                VARCHAR( 128) , '.
                            '`User_Avatar`              VARCHAR( 64 ) , '.
                            '`User_FirstName`           VARCHAR( 128) , '.
                            '`User_LastName`            VARCHAR( 128) , '.
                            '`User_eMail`               VARCHAR( 128) , '.
                            '`User_Stars`               INT DEFAULT 0 , '.
                            '`User_Theme`               VARCHAR( 128) , '.
                            '`User_Days`                INT DEFAULT 1 , '.
                            '`User_Date`                DATETIME DEFAULT NULL, '.
                            'PRIMARY KEY (  `User_Key` ) ) ENGINE=InnoDB', $link);
        }

        // UPDATE COLUMN WITHOUT DELETING TABLE
        if (mysql_query("SELECT * FROM `".$_SESSION['prefix']."user`")) {
            // GET THE COLUMN NAMES
            $userDays = false;
            $columns = mysql_query('SHOW COLUMNS FROM `'.$_SESSION['prefix'].'user`');
            while($row = mysql_fetch_array($columns)) {
                if ($row[0]=="User_Days") { $userDays = true; }
            }
            // ADD COLUMNS
            if (!$userDays) { mysql_query('ALTER TABLE `'.$_SESSION['prefix'].'user` '.
                                           'ADD `User_Days` INT DEFAULT 1 AFTER `User_Theme`'); }
        }
        else {
            $textstatus = "can not create `".$_SESSION['prefix']."user` table";
            $error = 13;
        }

        /*
        // ADD TEST USERS
        $avatars = array("U+IOHgggDZIDgqNgg8LLG","RJJCF7ggB2GG/qD/gFEED","VhGMCyggBACDVqM/IkLLE","PZCIEjggEXCNdqAVgzKKI");
        $firsnames = array("Bob","Sue","Roger","Mary","Rick","Amy","Paul","Michelle","Vladimir","Anna","Richard","Charlotte","John","Elizabeth","Oliver","Josephine");
        $lastname = array("ma","mi","mu","mo","pa","pi","pu","po","ta","ti","tu","to","man","min","mun","mon","pan","pin","pun","pon","tan","tin","tun","ton","ra","ri","ru","ro","ran","rin","run","ron");
        for ($i=0; $i<50; $i++) {
            $ln=$lastname[($i*7)%count($lastname)].$lastname[(floor($i/3)*5)%count($lastname)].$lastname[($i*11)%count($lastname)];
            mysql_query("DELETE FROM `".$_SESSION['prefix']."user` WHERE `User_Id`='test".$i."'");
            insertNewUser("test".$i, "test".$i, $avatars[$i%count($avatars)], $firsnames[$i%count($firsnames)], ucfirst($ln) );
        }
        // CHECK HOMONYMES
        for ($i=1; $i<5; $i++) {
            $ln=$lastname[0].$lastname[0].$lastname[0];
            insertNewUser("test0", "test".$i, $avatars[0], $firsnames[0], ucfirst($ln) );
        }
        */

        // USER GROUP OF FRIENDS
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."circle`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'circle` ('.
                            '`Circle_Key`              INT NOT NULL AUTO_INCREMENT, '.
                            '`Circle_Name`             VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`                INT NOT NULL, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Circle_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Circle_Key` )) ENGINE=InnoDB', $link);
        }

        // USER FRIENDS
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."friend`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'friend` ('.
                            '`User_Key`                 INT NOT NULL, '.
                            '`Friend_Key`               INT NOT NULL, '.
                            '`Timestamp`                TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, '.
                            '`Accept`                   BOOL DEFAULT false, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'Friend_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'User_Friend_Key` FOREIGN KEY (`Friend_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `User_Key`, `Friend_Key` )) ENGINE=InnoDB', $link);
        }


        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."friendbycircle`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'friendbycircle` ('.
                            '`Circle_Key`              INT NOT NULL, '.
                            '`Friend_Key`              INT NOT NULL, '.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'FriendByCircle_Circle_Key` FOREIGN KEY (`Circle_Key`) REFERENCES `'.$_SESSION['prefix'].'circle` '.
                            ' (`Circle_Key`) ON DELETE CASCADE,'.
                            ' CONSTRAINT `'.$_SESSION['prefix'].'FriendByCircle_Friend_Key` FOREIGN KEY (`Friend_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Circle_Key`, `Friend_Key` )) ENGINE=InnoDB', $link);
        }


    }
}

?>
