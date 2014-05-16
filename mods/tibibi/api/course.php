<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include "check.php";

if (!$error) {
    if ($_GET["action"]=="new") {
        $value = $_GET["value"];
        mysql_query("INSERT INTO `".$_SESSION['prefix']."course` (`Course_Name`,`User_Id`, `Course_Description`) VALUES ('".
                $_GET["value"]."','".$_GET["username"]."','')");
    }
    else
    if ($_GET["action"]=="upd") {
        $value = $_GET["value"];
        if (strlen($_GET["value"])) {
            if ( mysql_query("UPDATE `".$_SESSION['prefix']."course` SET `Course_Name`='".$_GET["value"]."' ".
                            "WHERE `Course_Name`='".$_GET["course"]."' AND User_Id='".$_GET["username"]."'") )
            {
                mysql_query("UPDATE `".$_SESSION['prefix']."coursebytibibi` SET `Course_Name`='".$_GET["value"]."' ".
                            "WHERE `Course_Name`='".$_GET["course"]."' AND User_Id='".$_GET["username"]."'");
            }
            else { $value = $_GET["course"]; }
        }
        else {
            mysql_query("UPDATE `".$_SESSION['prefix']."course` SET Course_Description='".$_GET["description"]."' ".
                        "WHERE `Course_Name`='".$_GET["course"]."' AND User_Id='".$_GET["username"]."'");
        }
    }
    else
    if ($_GET["action"]=="del") {
        if ( mysql_query("DELETE FROM `".$_SESSION['prefix']."course` WHERE `Course_Name`='".$_GET["value"]."' ".
                        "AND User_Id='".$_GET["username"]."'") )
        {
            mysql_query("DELETE FROM `".$_SESSION['prefix']."coursebytibibi` WHERE `Course_Name`='".$_GET["value"]."' ".
                        "AND User_Id='".$_GET["username"]."'");
        }
    }
    else
    if ($_GET["action"]=="list") {
        $courses = mysql_query("SELECT * FROM `".$_SESSION['prefix']."course` WHERE User_Id='".$_GET["username"]."' ORDER BY Course_Name");
        $json = "";
        while($c = mysql_fetch_array($courses)) {
            if (strlen($json)) { $json.=","; }
            $json.='"'.$c["Course_Name"].'"';
        }
    }
    else {
        $courses = mysql_query("SELECT * FROM `".$_SESSION['prefix']."course` WHERE User_Id='".$_GET["username"]."' AND ".
                            "Course_Name='".$_GET["value"]."'");
        $description = "";
        while($c = mysql_fetch_array($courses)) {
            $description = $c["Course_Description"];
        }
    }
    $status = "success";

}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
if ($value)       { echo ', "value" : "'.$value.'"'; }
if ($description) { echo ',  "description":"'.$description.'"'; }
if ($json)        { echo ',  "courses":['.$json.']'; }
echo '}';


?>
