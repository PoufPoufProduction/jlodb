<?php
include "database.php";

// EXERCICE.PHP
// @return ONE EXERCICE WITH ITS ARGUMENTS

if (!$error) {
	$where = "";
    
    if (array_key_exists("activity",$_GET)) {
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
    
    if (array_key_exists("classification",$_GET)) {
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

    if (array_key_exists("levelmin",$_GET))     { $where.= " AND `Exercice_Level` >= ".$_GET["levelmin"]." "; }
    if (array_key_exists("levelmax",$_GET))     { $where.= " AND `Exercice_Level` <= ".$_GET["levelmax"]." "; }
    if (array_key_exists("diffmin",$_GET))      { $where.= " AND `Exercice_Difficulty` >= ".$_GET["diffmin"]." "; }
    if (array_key_exists("diffmax",$_GET))      { $where.= " AND `Exercice_Difficulty` <= ".$_GET["diffmax"]." "; }
    if (array_key_exists("extendmin",$_GET))    { $where.= " AND `Exercice_Duration` >= ".$_GET["extendmin"]." "; }
    if (array_key_exists("extendmax",$_GET))    { $where.= " AND `Exercice_Duration` <= ".$_GET["extendmax"]." "; }

    if (array_key_exists("id",$_GET))           { $where.= " AND `Exercice_Id` = '".$_GET["id"]."'"; }
    else                                        { $where.= " AND `Exercice_Tags` NOT LIKE '%debug%'"; }
    

    $exercice = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."exercice`, `".$_SESSION['prefix']."activity` WHERE ".
                            " `Exercice_Activity` = `Activity_Name`".$where." ORDER BY RAND( ) LIMIT 1");

    $row = mysqli_fetch_array($exercice);
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
if (isset($status))                     { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)            { echo '  "error" : '.$error.','; }
if (isset($textstatus))                 { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($id))                         { echo '  "id": "'.$id.'",'; }
if (array_key_exists("lang",$_SESSION)) { echo '  "lang": "'.$_SESSION['lang'].'",'; }
if (isset($activity))                   { echo '  "activity": "'.$activity.'",'; }
if (isset($label))                      { echo '  "label": "'.$label.'",'; }
if (isset($title))                      { echo '  "title": "'.$title.'",'; }
if (isset($level))                      { echo '  "level": "'.$level.'",'; }
if (isset($diff))                       { echo '  "difficulty": "'.$diff.'",'; }
if (isset($time))                       { echo '  "time": "'.$time.'",'; }
if (isset($class))                      { echo '  "classification": "'.$class.'",'; }
if (isset($ext))                        { echo '  "ext": "'.$ext.'",'; }
if (isset($param))                      { echo '  "data": {'.$param.'},'; }
if (isset($locale))                     { echo '  "locale": {'.$locale.'},'; }
echo '  "from" : "jlodb/api" }';

?>
