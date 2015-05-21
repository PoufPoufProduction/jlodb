<?php

/**
 *   drop jlodb tables and re-build every thing from rdf files
 */

$forceReadFile = 1;
include "database.php";
include "_insert.php";

if (!$error) {
    $config             = '  "settings":{"host":"'.$_SESSION['host'].'", "database":"'.$_SESSION['database'].'", '.
                          '"username":"'.$_SESSION['username'].'"},';
    $version            = "0.0-1";
    $lang               = ($_GET["lang"]?$_GET["lang"]:"fr-FR");
    $_SESSION['lang']   = $lang;
    $warnings           = array();


    // CHECK IF THE CALLER IS LOGGED AS ADMIN
    if (!$_SESSION['admin']) {
        $textstatus = "operation is not authorized";
        $error = 100;
    }
    else {
        mysql_query('DROP TABLE '.$_SESSION['prefix'].'tags');
        mysql_query('DROP TABLE '.$_SESSION['prefix'].'exercice');
        mysql_query('DROP TABLE '.$_SESSION['prefix'].'activity');
        mysql_query('DROP TABLE '.$_SESSION['prefix'].'jlodb');

        // BUILD THE TABLES
       if (mysql_query('CREATE TABLE `'.$_SESSION['prefix'].'jlodb` ('.
                            '`Version`                  VARCHAR(50)     NOT NULL, '.
                            '`Date`                     DATE            NOT NULL, '.
                            '`Language`                 VARCHAR(50)     NOT NULL, '.
                            '`Lock`                     BOOL DEFAULT false'.
                        ') ENGINE=InnoDB', $link) &&
           mysql_query('CREATE TABLE `'.$_SESSION['prefix'].'activity` ('.
                            '`Activity_Name`            VARCHAR( 64 )   NOT NULL , '.
                            '`Activity_Title`           VARCHAR( 64 )   NOT NULL , '.
                            '`Activity_Key`             VARCHAR( 4 )    NOT NULL , '.
                            '`Activity_Description`     TEXT            NOT NULL , '.
                            '`Activity_External`        VARCHAR( 255 ) , '.
                            '`Activity_Locale`          TEXT , '.
                       'PRIMARY KEY (  `Activity_Name` ) ) ENGINE=InnoDB', $link) &&
           mysql_query('CREATE TABLE  `'.$_SESSION['prefix'].'exercice` ('.
                            '`Exercice_Id`              VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL , '.
                            '`Exercice_Activity`        VARCHAR( 64 )   NOT NULL , '.
                            '`Exercice_Title`           VARCHAR( 255 )  NOT NULL , '.
                            '`Exercice_Parameters`      TEXT , '.
                            '`Exercice_Level`           INT             NOT NULL , '.
                            '`Exercice_Difficulty`      INT             NOT NULL , '.
                            '`Exercice_Classification`  VARCHAR( 64 )   NOT NULL , '.
                            '`Exercice_Duration`        INT             NOT NULL, '.
                            '`Exercice_Tags`            VARCHAR( 128 ) , '.
                            '`Exercice_Variant`         VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin , '.
                            '`Exercice_Reference`       VARCHAR( 64 ) , '.
                            '`Exercice_Nb`              INT , '.
                       'PRIMARY KEY (  `Exercice_Id` ), '.
                       'FOREIGN KEY ( `Exercice_Activity` ) REFERENCES '.$_SESSION['prefix'].'activity(`Activity_Name`)) '.
                       'ENGINE=InnoDB',
                       $link) &&
            mysql_query('CREATE TABLE `'.$_SESSION['prefix'].'tags` (`Tag` VARCHAR(50) NOT NULL ) ENGINE=InnoDB', $link)
            ) {

            // FILL THE ACTIVITY TABLE THANKS TO THE ACTIVITIES.RDF FILE
            $activities = "../activities/activities.rdf";
            if (!file_exists($activities)) {
                $textstatus = "$activities: file is missing";
                $error = 5;
            }
            else {
                // READ THE RDF FILE
                $rdf = file_get_contents($activities);
                $rdf = str_replace('rdf:','rdf_', $rdf);
                $rdf = str_replace('dct:','dct_', $rdf);
                $rdf = str_replace('xml:','xml_', $rdf);
                $xml = new SimpleXMLElement($rdf);

                // PARSE THE ACTIVITIES RDF FILE FOR FILLING THE ACTIVITY TABLE
                foreach ($xml->children() as $childName=>$child) {
                    $activityName           = "";
                    $activityTitle          = "";
                    $activityDescription    = "";
                    $activityExternal       = "";
                    $activityLocale         = "";
                    if (strcmp($childName,"rdf_Description")==0) {
                        $activityName = str_replace("urn:activity:", "", $child->attributes()->rdf_about);
                        foreach ($child->children() as $dcName=>$dc) {
                            if (strcmp($dc->attributes()->xml_lang, $lang)==0) {
                                if (strcmp($dcName,"dct_title")==0)         { $activityTitle=$dc; }         else
                                if (strcmp($dcName,"dct_abstract")==0)      { $activityDescription=$dc; }   else
                                if (strcmp($dcName,"dct_description")==0)   { $activityLocale=$dc; }
                            }
                            if (strcmp($dcName,"dct_requires")==0)      { $activityExternal=$dc; }
                        }
                    }

                    if ($activityName && $activityTitle && $activityDescription) {
                        $activityName = str_replace("'", "\'", $activityName);
                        $activityTitle = str_replace("'", "\'", $activityTitle);
                        $activityLocale = str_replace("'", "\'", $activityLocale);
                        $activityDescription = str_replace("'", "\'", $activityDescription);

                        $sql = "INSERT INTO `".$_SESSION['prefix']."activity` (`Activity_Name`, `Activity_Title`, `Activity_Key`, ".
                               "`Activity_Description`, `Activity_External`, `Activity_Locale` ) VALUES ('".
                               $activityName."','".$activityTitle."','".substr($activityName,0,1).substr($activityName, -1)."','".
                               $activityDescription."',".(strlen($activityExternal)?("'".$activityExternal."'"):"NULL").",".
                               (strlen($activityLocale)?("'".$activityLocale."'"):"NULL").")";
                        mysql_query($sql , $link);
                    }
                }

                $tags = array();

                // BROWSE THE ACTIVITIES DIRECTORY FOR FILLING THE EXERCICES TABLE
                $result = mysql_query("SELECT * FROM `".$_SESSION['prefix']."activity`");
                while ($row = mysql_fetch_array($result)) {
                    if ($handle = opendir("../data/".$row["Activity_Name"])) {
                        while (false !== ($file = readdir($handle))) {
                            if ($file != "." && $file != "..") {

                                insertIntoDB($link,$row["Activity_Name"],$row["Activity_Key"],$file,$lang,$warnings,$tags);
                            }
                        }
                    }
                }

                // FILL THE NB COLUMN
                $nb = mysql_query("SELECT `Exercice_Variant`,count(*) as NB FROM `".$_SESSION['prefix']."exercice`".
                                  " GROUP BY `Exercice_Variant`");
                while ($n = mysql_fetch_array($nb)) {
                    if (strlen($n["Exercice_Variant"])) {
                        mysql_query("UPDATE `".$_SESSION['prefix']."exercice` SET `Exercice_Nb`=".$n["NB"].
                                    " WHERE `Exercice_Id`='".$n["Exercice_Variant"]."'");
                    }
                }

                // FILL THE TAGS TABLE
                foreach ($tags as $tag) {
                    $sql = "INSERT INTO `".$_SESSION['prefix']."tags` (`Tag`) VALUES ('".$tag."')";
                    mysql_query($sql , $link);
                }

                // FILL THE JLODB TABLE
                $sql = "INSERT INTO `".$_SESSION['prefix']."jlodb` (`Version`,`Date`,`Language`,`Lock`) VALUES ('".
                       $version."','".date("Ymd")."','".$lang."',false)";
                mysql_query($sql , $link);

                $status = "success";
            }
        }
        else {
            $error = 6;
            $textstatus = mysql_error();
        }
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo $config;
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "warnings": [';
    foreach ($warnings as $k=>$value) { if ($k) { echo ","; } echo '"'.$value.'"'; }
echo ' ]';
echo '}';

?>
