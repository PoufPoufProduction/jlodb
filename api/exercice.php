<?php
include "database.php";

// EXERCICE.PHP
// @return ONE EXERCICE WITH ITS ARGUMENTS

if (!$error) {
    // THE CONDITIONS
    if (strlen($_GET["activity"])) {
        $activity = "";
        $tok = strtok($_GET["activity"], ",");
        while($tok!=false) {
            if (strlen($activity)!=0)       { $activity.=","; }
            if (strpos($tok,"'")==false)    { $activity.="'".$tok."'"; }
            else                            { $activity.=$tok; }
            $tok = strtok(",");
        }

        $where.= " AND `Exercice_Activity` IN ( ".str_replace("\'", "'", $activity)." )";
    }

    // THE LEVEL
    if (strlen($_GET["levelmin"])) {
        $where.= " AND `Exercice_Level` >= ".$_GET["levelmin"]." ";
    }
    if (strlen($_GET["levelmax"])) {
        $where.= " AND `Exercice_Level` <= ".$_GET["levelmax"]." ";
    }

    // THE DIFFICULTY
    if (strlen($_GET["diffmin"])) {
        $where.= " AND `Exercice_Difficulty` >= ".$_GET["diffmin"]." ";
    }
    if (strlen($_GET["diffmax"])) {
        $where.= " AND `Exercice_Difficulty` <= ".$_GET["diffmax"]." ";
    }

    // THE DURATION
    if (strlen($_GET["extendmin"])) {
        $where.= " AND `Exercice_Duration` >= ".$_GET["extendmin"]." ";
    }
    if (strlen($_GET["extendmax"])) {
        $where.= " AND `Exercice_Duration` <= ".$_GET["extendmax"]." ";
    }

    // THE CLASSIFICATION
    if (strlen($_GET["classification"])) {
        $classification = "";
        $tok = strtok($_GET["classification"], ",");
        while($tok!=false) {
            if (strlen($classification)!=0) { $classification.=","; }
            if (strpos($tok,"'")==false)    { $classification.="'".$tok."'"; }
            else                            { $classification.=$tok; }
            $tok = strtok(",");
        }
        $where.= " AND `Exercice_Classification` IN ( ".str_replace("\'", "'", $classification)." )";
    }

    // THE ID
    if (strlen($_GET["id"])) {
        $where.= " AND `Exercice_Id` = '".$_GET["id"]."'";
    }
    else {
        $where.= " AND `Exercice_Tags` NOT LIKE '%debug%'";
    }

    $exercice = mysql_query("SELECT * FROM `".$_SESSION['prefix']."exercice`, `".$_SESSION['prefix']."activity` WHERE ".
                            " `Exercice_Activity` = `Activity_Name`".$where." ORDER BY RAND( ) LIMIT 1");

    $row = mysql_fetch_array($exercice);
    if ($row) {
        $activity   = $row["Exercice_Activity"];
        $label      = $row["Activity_Title"];
        $id         = $row["Exercice_Id"];
        $param      = $row["Exercice_Parameters"];
        $title      = $row["Exercice_Title"];
        $level      = $row["Exercice_Level"];
        $diff       = $row["Exercice_Difficulty"];
        $time       = $row["Exercice_Duration"];
        $class      = $row["Exercice_Classification"];
        $locale     = $row["Activity_Locale"];
        $ext        = $row["Activity_External"];
        $status     = "success";
    }
    else {
        $error = 10;
        $textstatus = "can not find exercice";
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "id": "'.$id.'",';
echo '  "lang": "'.$_SESSION['lang'].'",';
echo '  "activity": "'.$activity.'",';
echo '  "label": "'.$label.'",';
echo '  "title": "'.$title.'",';
echo '  "level": "'.$level.'",';
echo '  "difficulty": "'.$diff.'",';
echo '  "time": "'.$time.'",';
echo '  "classification": "'.$class.'",';
echo '  "ext": "'.$ext.'",';
echo '  "data": {'.$param.'},';
echo '  "locale": {'.$locale.'}';
echo '}';

?>
