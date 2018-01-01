<?php

/**
 *   drop jlodb tables and re-build every thing from rdf files
 */

$forceReadFile = 1;
include "database.php";
include "_insert.php";
include "_login.php";

if ( array_key_exists("username",$_GET) && strlen($_GET["username"]) && array_key_exists("password",$_GET) && strlen($_GET["password"]))
{
    login($_GET["username"], $_GET["password"], $status, $textstatus, $error);
}

if (!$error) {
    $config             = '  "settings":{"host":"'.$_SESSION['host'].'", "database":"'.$_SESSION['database'].'", '.
                          '"username":"'.$_SESSION['username'].'"},';
    $version            = "0.0-1";
    $lang               = array_key_exists("lang",$_GET)?$_GET["lang"]:"fr-FR";
    $_SESSION['lang']   = $lang;
    $warnings           = array();


    // CHECK IF THE CALLER IS LOGGED AS ADMIN
    if (!$_SESSION['admin']) {
        $textstatus = "operation is not authorized";
        $error = 100;
    }
    else {
        mysqli_query($link, 'DROP TABLE '.$_SESSION['prefix'].'tags');
        mysqli_query($link, 'DROP TABLE '.$_SESSION['prefix'].'exercice');
        mysqli_query($link, 'DROP TABLE '.$_SESSION['prefix'].'activity');
        mysqli_query($link, 'DROP TABLE '.$_SESSION['prefix'].'jlodb');

        // BUILD THE TABLES
       if (mysqli_query($link, 'CREATE TABLE `'.$_SESSION['prefix'].'jlodb` ('.
                            '`Version`                  VARCHAR(50)     NOT NULL, '.
                            '`Date`                     DATE            NOT NULL, '.
                            '`Language`                 VARCHAR(50)     NOT NULL, '.
                            '`Lock`                     BOOL DEFAULT false'.
                        ') ENGINE=InnoDB') &&
           mysqli_query($link, 'CREATE TABLE `'.$_SESSION['prefix'].'activity` ('.
                            '`Activity_Name`            VARCHAR( 64 )   NOT NULL , '.
                            '`Activity_Title`           VARCHAR( 64 )   NOT NULL , '.
                            '`Activity_Key`             VARCHAR( 4 )    NOT NULL , '.
                            '`Activity_Description`     TEXT            NOT NULL , '.
                            '`Activity_Source`          TEXT , '.
                            '`Activity_External`        VARCHAR( 255 ) , '.
                            '`Activity_Locale`          TEXT , '.
                       'PRIMARY KEY (  `Activity_Name` ) ) ENGINE=InnoDB') &&
           mysqli_query($link, 'CREATE TABLE  `'.$_SESSION['prefix'].'exercice` ('.
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
                            '`Exercice_Base`            VARCHAR( 64 ) CHARACTER SET utf8 COLLATE utf8_bin , '.
                            '`Exercice_Reference`       VARCHAR( 64 ) , '.
                            '`Exercice_Source`          TEXT , '.
                            '`Exercice_Nb`              INT , '.
                       'PRIMARY KEY (  `Exercice_Id` ), '.
                       'FOREIGN KEY ( `Exercice_Activity` ) REFERENCES '.$_SESSION['prefix'].'activity(`Activity_Name`)) '.
                       'ENGINE=InnoDB') &&
            mysqli_query($link, 'CREATE TABLE `'.$_SESSION['prefix'].'tags` (`Tag` VARCHAR(50) NOT NULL ) ENGINE=InnoDB')
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
                    $activitySource         = "";
                    if (strcmp($childName,"rdf_Description")==0) {
                        $activityName = str_replace("urn:activity:", "", $child->attributes()->rdf_about);
                        foreach ($child->children() as $dcName=>$dc) {
                            if (strcmp($dc->attributes()->xml_lang, $lang)==0) {
                                if (strcmp($dcName,"dct_title")==0)         { $activityTitle=$dc; }         else
                                if (strcmp($dcName,"dct_abstract")==0)      { $activityDescription=$dc; }   else
                                if (strcmp($dcName,"dct_description")==0)   { $activityLocale=$dc; }        
                            }
                            if (strcmp($dcName,"dct_requires")==0)      { $activityExternal=$dc; }          else
                            if (strcmp($dcName,"dct_source")==0)        { $activitySource=$dc; }
                        }
                    }

                    if ($activityName && $activityTitle && $activityDescription) {
                        $activityName = str_replace("'", "\'", $activityName);
                        $activityTitle = str_replace("'", "\'", $activityTitle);
                        $activityLocale = str_replace("'", "\'", $activityLocale);
                        $activityDescription = str_replace("'", "\'", $activityDescription);

                        $sql = "INSERT INTO `".$_SESSION['prefix']."activity` (`Activity_Name`, `Activity_Title`, `Activity_Key`, ".
                               "`Activity_Description`, `Activity_Source`, `Activity_External`, `Activity_Locale` ) VALUES ('".
                               $activityName."','".$activityTitle."','".substr($activityName,0,1).substr($activityName, -1)."','".
                               $activityDescription."',"
                               .(strlen($activitySource)?("'".$activitySource."'"):"NULL").","
                               .(strlen($activityExternal)?("'".$activityExternal."'"):"NULL").","
                               .(strlen($activityLocale)?("'".$activityLocale."'"):"NULL").")";
                        mysqli_query($link, $sql);
                    }
                }

                $tags = array();

                // BROWSE THE ACTIVITIES DIRECTORY FOR FILLING THE EXERCICES TABLE
                $result = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."activity`");
                while ($row = mysqli_fetch_array($result)) {
                    if ($handle = opendir("../data/".$row["Activity_Name"])) {
                        while (false !== ($file = readdir($handle))) {
                            if ($file != "." && $file != ".." && strpos($file,".rdf")) {

                                insertIntoDB($link,$row["Activity_Name"],$row["Activity_Key"],$file,$lang,$warnings,$tags,false);
                            }
                        }
                    }
                }

                // FILL THE NB COLUMN
                $nb = mysqli_query($link, "SELECT `Exercice_Variant`,count(*) as NB FROM `".$_SESSION['prefix']."exercice`".
                                  " GROUP BY `Exercice_Variant`");
                while ($n = mysqli_fetch_array($nb)) {
                    if (strlen($n["Exercice_Variant"])) {
                        mysqli_query($link, "UPDATE `".$_SESSION['prefix']."exercice` SET `Exercice_Nb`=".$n["NB"].
                                    " WHERE `Exercice_Id`='".$n["Exercice_Variant"]."'");
                    }
                }

                // FILL THE TAGS TABLE
                foreach ($tags as $tag) {
                    $sql = "INSERT INTO `".$_SESSION['prefix']."tags` (`Tag`) VALUES ('".$tag."')";
                    mysqli_query($link, $sql);
                }

                // FILL THE JLODB TABLE
                $sql = "INSERT INTO `".$_SESSION['prefix']."jlodb` (`Version`,`Date`,`Language`,`Lock`) VALUES ('".
                       $version."','".date("Ymd")."','".$lang."',false)";
                mysqli_query($link, $sql);

                $status = "success";
            }
        }
        else {
            $error = 6;
            $textstatus = mysqli_error($link);
        }
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo $config;
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($warnings)) { 
    echo '  "warnings": [';
        foreach ($warnings as $k=>$value) { if ($k) { echo ","; } echo '"'.$value.'"'; }
    echo ' ],';
}
echo '  "from" : "jlodb/api" }';

?>
