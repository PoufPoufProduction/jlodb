<?php

include "database.php";

if (!$error) {
    if (array_key_exists("name",$_GET)) {
        $activitiy = mysql_query("SELECT * FROM `".$_SESSION['prefix']."activity` WHERE ".
                                "`Activity_Name` = '".$_GET["name"]."' LIMIT 1");

        $row = $activitiy?mysql_fetch_array($activitiy):0;
        if ($row) {

            // NUMBER OF EXERCICES
            $number=mysql_fetch_array(mysql_query("SELECT COUNT(*) FROM `".$_SESSION['prefix']."exercice` WHERE ".
                                "`Exercice_Activity` = '".$_GET["name"]."'"));

            // CLASSIFICATION
            $classification=mysql_query("SELECT DISTINCT `Exercice_Classification` FROM `".$_SESSION['prefix']."exercice` WHERE ".
                                "`Exercice_Activity` = '".$_GET["name"]."'");

            $class = "";
            while ($classit = mysql_fetch_array($classification)) {
                if ($class) { $class.=","; }
                $class.='"'.$classit["Exercice_Classification"].'"';
            }

            // DATA
            $files = "";
            if ($handle = opendir("../data/".$_GET["name"])) {
                while (false !== ($file = readdir($handle))) {
                    if ($file != "." && $file != "..") {
                        if ($files) { $files.=","; }
                        $files.='"'.$file.'"';
                    }
                }
            }

            // MISC
            $name       = $row["Activity_Name"];
            $label      = $row["Activity_Title"];
            $locale     = $row["Activity_Locale"];
            $status     = "success";
        }
        else {
            $error = 8;
            $textstatus = "can not find activity";
        }

    } else {
        $status = "error";
        $error = 9;
        $textstatus = "activity name is missing";
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
echo '  "textStatus" : "'.$textstatus.'",';
if ($error)     { echo '  "error" : '.$error; } else {
echo '  "name": "'.$name.'",';
echo '  "lang": "'.$_SESSION['lang'].'",';
echo '  "label": "'.$label.'",';
echo '  "exercices": '.$number[0].',';
echo '  "classification": ['.$class.'],';
echo '  "files": ['.$files.'],';
echo '  "locale": {'.$locale.'}';
}
echo '}';

?>
