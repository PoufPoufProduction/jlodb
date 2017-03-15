<?php

include "database.php";

if (!$error) {
    if (array_key_exists("name",$_GET)) {
        $activitiy = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."activity` WHERE ".
                                "`Activity_Name` = '".$_GET["name"]."' LIMIT 1");

        $row = $activitiy?mysqli_fetch_array($activitiy):0;
        if ($row) {

            // NUMBER OF EXERCICES
            $number=mysqli_fetch_array(mysqli_query($link, "SELECT COUNT(*) FROM `".$_SESSION['prefix']."exercice` WHERE ".
                                "`Exercice_Activity` = '".$_GET["name"]."'"));

            // CLASSIFICATION
            $classification=mysqli_query($link, "SELECT DISTINCT `Exercice_Classification` FROM `".$_SESSION['prefix']."exercice` WHERE ".
                                "`Exercice_Activity` = '".$_GET["name"]."'");

            $class = "";
            while ($classit = mysqli_fetch_array($classification)) {
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
if (isset($status))                     { echo '  "status" : "'.$status.'",'; }
if (isset($textstatus))                 { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($error) && $error)            { echo '  "error" : '.$error; }
if (isset($name))                       { echo '  "name": "'.$name.'",'; }
if (array_key_exists("lang",$_SESSION)) { echo '  "lang": "'.$_SESSION['lang'].'",'; }
if (isset($label))                      { echo '  "label": "'.$label.'",'; }
if (isset($number))                     { echo '  "exercices": '.$number[0].','; }
if (isset($class))                      { echo '  "classification": ['.$class.'],'; }
if (isset($files))                      { echo '  "files": ['.$files.'],'; }
if (isset($locale))                     { echo '  "locale": {'.$locale.'},'; }
echo '  "from" : "jlodb/api" }';

?>
