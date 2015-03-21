<?php
include "database.php";

// EXERCICES.PHP
// @return A LIST OF EXERCICES (USE EXERCICE.PHP TO GET THE PARAMETER OF ONE EXERCICE)

if (!$error) {

    // THE CONDITIONS
    $where="";
    if (strlen($_GET["activity"])) {
        if (strlen($where)) { $where.=" AND"; }

        $activity = "";
        $tok = strtok($_GET["activity"], ",");
        while($tok!=false) {
            if (strlen($activity)!=0)       { $activity.=","; }
            if (strpos($tok,"'")==-1)       { $activity.="'".$tok."'"; }
            else                            { $activity.=$tok; }
            $tok = strtok(",");
        }
        $where.= " `Exercice_Activity` IN ( ".str_replace("\'", "'", $activity)." )";
    }

    // THE LEVEL
    if (strlen($_GET["levelmin"])) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Level` >= ".$_GET["levelmin"]." ";
    }
    if (strlen($_GET["levelmax"])) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Level` <= ".$_GET["levelmax"]." ";
    }

    // THE DIFFICULTY
    if (strlen($_GET["diffmin"])) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Difficulty` >= ".$_GET["diffmin"]." ";
    }
    if (strlen($_GET["diffmax"])) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Difficulty` <= ".$_GET["diffmax"]." ";
    }

    // THE DURATION
    if (strlen($_GET["extendmin"])) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Duration` >= ".$_GET["extendmin"]." ";
    }
    if (strlen($_GET["extendmax"])) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Duration` <= ".$_GET["extendmax"]." ";
    }

    // THE CLASSIFICATION
    if (strlen($_GET["classification"])) {
        if (strlen($where)) { $where.=" AND"; }

        $classification = "";
        $tok = strtok($_GET["classification"], ",");
        while($tok!=false) {
            if (strlen($classification)!=0) { $classification.=","; }
            if (strpos($tok,"'")==-1)       { $classification.="'".$tok."'"; }
            else                            { $classification.=$tok; }
            $tok = strtok(",");
        }

        $where.= " `Exercice_Classification` IN ( ".str_replace("\'", "'", $classification)." )";
    }

    // THE TAGS
    if (strlen($_GET["tag"])) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Tags` = '".$_GET["tag"]."'";
    }

    // THE REFERENCE
    if (strlen($_GET["reference"])) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Reference` = '".$_GET["reference"]."'";
    }

    // THE ID
    if (strlen($_GET["id"])) {
        if (strlen($where)) { $where.=" AND"; }
        $where.=" (`Exercice_Id`='".$_GET["id"]."' OR `Exercice_Variant`='".$_GET["id"]."')";
    }

    // COUNT THE NUMBER OF MATCHING EXERCICES (WITHOU ORDER, LIMIT NOR ALTERNATIVE GROUP)
    $sql = "SELECT COUNT(*) FROM `".$_SESSION['prefix']."exercice`";
    if (strlen($where)) { $sql.=" WHERE".$where; }
    $count = mysql_fetch_array(mysql_query($sql));

    // THE VARIANT
    if (!strlen($_GET["id"]) && !strlen($_GET["alt"])) {
        if (strlen($where)) { $where.=" AND"; }
        $where.=" `Exercice_Variant`=''";
    }

    // THE ORDER
    $order = " ORDER BY Exercice_Id ASC";
    if (strlen($_GET["order"])&&strlen($_GET["by"])) {
        $order=" ORDER BY Exercice_".$_GET["by"]." ".$_GET["order"];
        if ($_GET["by"]!="Id") { $order.=",Exercice_Id ASC"; }
    }

    // BUILD THE REQUEST
    $sql = "SELECT * FROM `".$_SESSION['prefix']."exercice`";
    if (strlen($where)) { $sql.=" WHERE".$where; }


    $limit = "500";
    if (strlen($_GET["limit"])) { $limit = $_GET["limit"]; }
    $sql.= $order." LIMIT ".$limit;

    if (strlen($_GET["raw"])) {
        $sql = "SELECT * FROM `".$_SESSION['prefix']."exercice`";
    }

    $exercice = mysql_query($sql);
    $json = "";
    while($row = mysql_fetch_array($exercice)) {
        if (strlen($json)) { $json.=strlen($_GET["raw"])?"\n":","; }
        $json.='{ "id":"'.$row["Exercice_Id"].'","label":"'.$row["Exercice_Title"].'",'.
               '"activity":"'.$row["Exercice_Activity"].'","classification":"'.$row["Exercice_Classification"].'",'.
               '"level":'.$row["Exercice_Level"].',"diff":'.$row["Exercice_Difficulty"].',"extend":'.
               $row["Exercice_Duration"].',"variant":"'.$row["Exercice_Variant"].'","nb":'.$row["Exercice_Nb"].','.
               '"tag":"'.$row["Exercice_Tags"].'","reference":"'.$row["Exercice_Reference"].'"}';
    }
    $status     = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
if (strlen($_GET["raw"])) {
    echo $json;
}
else {
    echo '{';
    echo '  "status" : "'.$status.'",';
    if ($error)     { echo '  "error" : '.$error.','; }
    echo '  "textStatus" : "'.$textstatus.'",';
    echo '  "nb" : '.$count[0].',';
    echo '  "exercices" : ['.$json.']';
    echo '}';
}
?>
