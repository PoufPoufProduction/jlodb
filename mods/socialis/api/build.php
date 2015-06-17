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
        // THE ALL NODE STATE IN BASE 64 CODING
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."genius`")) {
            mysql_query('CREATE TABLE `'.$_SESSION['prefix'].'genius` ('.
                            '`User_Key` INT NOT NULL, `Genius` TEXT, PRIMARY KEY (  `User_Key` ), '.
                            ' CONSTRAINT `fr_Genius_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE ) ENGINE=InnoDB', $link);
        }

        // THE STATE OF A NODE IN TEXT FORMAT ( 'l' for locked, '.' for opened, [0-5] for the notation )
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."state`")) {
            mysql_query('CREATE TABLE `'.$_SESSION['prefix'].'state` ('.
                            '`User_Key` INT NOT NULL, '.
                            '`Node_Id`  VARCHAR( 64 ) NOT NULL, '.
                            '`State` TEXT, '.
                            ' PRIMARY KEY ( `User_Key`, `Node_Id` ), '.
                            ' CONSTRAINT `fr_State_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE ) ENGINE=InnoDB', $link);
        }

        // USER GROUP OF FRIENDS
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."group`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'group` ('.
                            '`Group_Name`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`User_Key`                INT NOT NULL, '.
                            '`Group_Index`             INT NOT NULL, '.
                            ' CONSTRAINT `fr_Group_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Group_Name`, `User_Key` )) ENGINE=InnoDB', $link);
        }

        // USER FRIENDS
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."friend`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'friend` ('.
                            '`User_Key`                 INT NOT NULL, '.
                            '`Friend_Key`               INT NOT NULL, '.
                            '`Host`                     VARCHAR( 64 ) DEFAULT NULL, '.
                            '`Group_Name`               VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin, '.
                            '`Timestamp`                TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, '.
                            '`Accept`                   BOOL DEFAULT false, '.
                            ' CONSTRAINT `fr_Friend_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `User_Key`, `Friend_Key`, `Host` )) ENGINE=InnoDB', $link);
        }

/*
// DESACTIVATED FOR THE MOMENT
        // TIBIBI EXERCICES SENT BY THE USER
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."send`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'send` ('.
                            '`Send_Id`                  VARCHAR( 32 ) NOT NULL, '.
                            '`User_Key`                 INT NOT NULL, '.
                            '`Course_Name`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, '.
                            '`Group_Name`               VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin, '.
                            '`Course_Label`             TEXT NOT NULL, '.
                            '`Timestamp`                TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, '.
                            '`Deadline`                 TIMESTAMP, '.
                            '`Finished`                 BOOL DEFAULT false, '.
                            ' CONSTRAINT `fr_Send_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' CONSTRAINT `fr_Send_Course_Name` FOREIGN KEY (`Course_Name`) REFERENCES `'.$_SESSION['prefix'].'course` '.
                            ' (`Course_Name`) ON UPDATE CASCADE ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Send_Id` )) ENGINE=InnoDB', $link);
        }

        // TIBIBI EXERCICES RECEIVED BY THE USER
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."recv`")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'recv` ('.
                            '`Recv_Id`                  VARCHAR( 32 ) NOT NULL, '.
                            '`User_Key`                 INT NOT NULL, '.
                            '`Course_Description`       TEXT, '.
                            '`Masked`                   BOOL DEFAULT false, '.
                            ' CONSTRAINT `fr_Recv_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' CONSTRAINT `fr_Recv_Send_Id` FOREIGN KEY (`Recv_Id`) REFERENCES `'.$_SESSION['prefix'].'send` '.
                            ' (`Send_Id`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Recv_Id`, `User_Key` )) ENGINE=InnoDB', $link);
        }
*/

        // STATIC AWARDS DATA (BUILT FROM XML FILES)
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."award`")) {
            mysql_query('CREATE TABLE `'.$_SESSION['prefix'].'award` (`Award_Counter` MEDIUMINT, '.
                       '`Award_Id` char(255) NOT NULL, '.
                       '`Award_Title` char(255) NOT NULL, `Award_Description` char(255), `Award_Label` TEXT NOT NULL, '.
                       '`Award_Type` char(255), `Award_Arg` char(255), `Award_Group` char(255), '.
                       'PRIMARY KEY (`Award_Id`)) ENGINE=InnoDB', $link);
        }

        // FILL THE NODE TABLE THANKS TO THE NODES.RDF FILE
        $counter = 0;
        if ($handle = opendir("../locale/".$_SESSION['lang']."/awards/")) {
            while (false !== ($nodesfile = readdir($handle))) {
                if ($nodesfile != "." && $nodesfile != "..") {
                    // READ THE RDF FILE
                    $rdf = file_get_contents("../locale/".$_SESSION['lang']."/awards/".$nodesfile);
                    $rdf = str_replace('rdf:','rdf_', $rdf);
                    $rdf = str_replace('dct:','dct_', $rdf);
                    $rdf = str_replace('xml:','xml_', $rdf);
                    $xml = new SimpleXMLElement($rdf);

                    // PARSE THE ACTIVITIES RDF FILE FOR FILLING THE ACTIVITY TABLE
                    foreach ($xml->children() as $childName=>$child) {
                        $awardId            = "";
                        $awardTitle         = "";
                        $awardDescription   = "";
                        $awardLabel         = "";
                        $awardType          = "";
                        $awardArg           = "";
                        $awardGroup         = "";
                        if (strcmp($childName,"rdf_Description")==0) {
                            foreach ($child->children() as $dcName=>$dc) {
                                if (strcmp($dcName,"dct_identifier")==0)         { $awardId=$dc; }              else
                                if (strcmp($dcName,"dct_description")==0)        { $awardDescription=$dc; }     else
                                if (strcmp($dcName,"dct_title")==0)              { $awardTitle=$dc; }           else
                                if (strcmp($dcName,"dct_type")==0)               { $awardType=$dc; }            else
                                if (strcmp($dcName,"dct_abstract")==0)           { $awardLabel=$dc; }           else
                                if (strcmp($dcName,"dct_isPartOf")==0)           { $awardGroup=$dc; }
                            }

                            $awardTitle = str_replace("'", "\'", $awardTitle);
                            $awardLabel = str_replace("'", "\'", $awardLabel);
                            $awardGroup = str_replace("'", "\'", $awardGroup);

                            $sql = "INSERT INTO `".$_SESSION['prefix']."award` (`Award_Counter`,`Award_Id`, `Award_Title`, `Award_Description`,".
                                   "`Award_Label`, `Award_Type`, `Award_Arg`, `Award_Group` ) VALUES (".$counter.",'".
                                $awardId."','".$awardTitle."','".$awardDescription."','".$awardLabel."','".$awardType."','".
                                $awardArg."','".$awardGroup."')";
                            $counter++;
                            mysql_query($sql , $link);
                        }
                    }

                }
            }
        }

        // USER REWARD
        if (!mysql_query("SELECT * FROM `".$_SESSION['prefix']."reward")) {
            mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'reward` ('.
                            '`User_Key`                 INT NOT NULL, '.
                            '`Award_Id`                 char(255) NOT NULL, '.
                            '`New`                      BOOL DEFAULT true, '.
                            '`Unread`                   BOOL DEFAULT true, '.
                            '`Pinned`                   BOOL DEFAULT false, '.
                            ' CONSTRAINT `fr_Reward_User_Key` FOREIGN KEY (`User_Key`) REFERENCES `'.$_SESSION['prefix'].'user` '.
                            ' (`User_Key`) ON DELETE CASCADE,'.
                            ' CONSTRAINT `fr_Reward_Award_Id` FOREIGN KEY (`Award_Id`) REFERENCES `'.$_SESSION['prefix'].'award` '.
                            ' (`Award_Id`) ON DELETE CASCADE,'.
                            ' PRIMARY KEY ( `Award_Id`, `User_Key` )) ENGINE=InnoDB', $link);
        }

        $status = "success";

        // UPDATE TEST USERS

        $tmp = mysql_query("SELECT `User_Key` FROM `".$_SESSION['prefix']."user` WHERE `User_Id`='test1'");
        if ($tmp=mysql_fetch_array($tmp)) {
            $key1 = $tmp[0];

            mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Theme`='theme2' WHERE `User_Key`=".$key1);
            mysql_query("INSERT INTO `".$_SESSION['prefix']."state` VALUES ('".$key1."', '1' ,".
                "'2222222222222222222222222222222222222222222222222222222222222222222222222222222.')");
            mysql_query("INSERT INTO `".$_SESSION['prefix']."state` VALUES ('".$key1."', '1001' , '5555555555555555.')");
            mysql_query("INSERT INTO `".$_SESSION['prefix']."group` VALUES ".
                        "('group1', '".$key1."' , 1),('group2', '".$key1."' , 2),('group3', '".$key1."' , 3)");
        }

        $tmp = mysql_query("SELECT `User_Key` FROM `".$_SESSION['prefix']."user` WHERE `User_Id`='test2'");
        if ($tmp=mysql_fetch_array($tmp)) {
            $key2 = $tmp[0];

            mysql_query("INSERT INTO `".$_SESSION['prefix']."friend` (`User_Key`, `Friend_Key`) VALUES ('".$key1."','".$key2."')");
            mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Date`=NOW(), `User_Days`=7 WHERE `User_Key`=".$key2);
            mysql_query("INSERT INTO `".$_SESSION['prefix']."state` VALUES ('".$key2."', '1' ,".
                "'555555555555555555555555555555555555555555555555555555555555555555.')");
            mysql_query("INSERT INTO `".$_SESSION['prefix']."state` VALUES ('".$key2."', '101' ,".
                "'22222222222222222222222222222222222222222222222222222222222222222222222222222222')");
            mysql_query("INSERT INTO `".$_SESSION['prefix']."genius` VALUES ('".$key2."', 'EAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAQAAAAAA')");
            mysql_query("INSERT INTO `".$_SESSION['prefix']."group` VALUES ('group1', '".$key2."' , 1)");


            $tmp = mysql_query("SELECT `User_Key` FROM `".$_SESSION['prefix']."user` WHERE `User_Id`='test40'");
            if ($tmp=mysql_fetch_array($tmp)) {
                $key40 = $tmp[0];

                $values = "";
                for ($i=($key2+1); $i<$key40; $i++) {
                    if (strlen($values)) { $values.=","; }
                    $values.= "('".$key2."','".$i."','group1',true),('".$i."','".$key2."',NULL,true)";
                }
                mysql_query("INSERT INTO `".$_SESSION['prefix']."friend` (`User_Key`, `Friend_Key`, `Group_Name`, `Accept`) VALUES ".$values);

            }
        }
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
