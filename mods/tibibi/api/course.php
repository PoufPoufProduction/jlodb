<?php
$apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

if (!$error) {
    if ($_GET["action"]=="new") {
        $value = $_GET["value"];
        mysql_query("INSERT INTO `".$_SESSION['prefix']."course` (`Course_Name`,`User_Key`, `Course_Description`) VALUES ('".
                $_GET["value"]."','".$_SESSION['User_Key']."','')");
    }
    else
    if ($_GET["action"]=="upd") {
        $value = $_GET["value"];
        if (strlen($_GET["value"])) {
            if (! mysql_query("UPDATE `".$_SESSION['prefix']."course` SET `Course_Name`='".$_GET["value"]."' ".
                            "WHERE `Course_Name`='".$_GET["course"]."' AND User_Key='".$_SESSION['User_Key']."'") ) {
                $value = $_GET["course"];
            }
        }
        else {
            mysql_query("UPDATE `".$_SESSION['prefix']."course` SET Course_Description='".$_GET["description"]."' ".
                        "WHERE `Course_Name`='".$_GET["course"]."' AND User_Key='".$_SESSION['User_Key']."'");
        }
    }
    else
    if ($_GET["action"]=="del") {
        mysql_query("DELETE FROM `".$_SESSION['prefix']."course` WHERE `Course_Name`='".$_GET["value"]."' ".
                        "AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if ($_GET["action"]=="list") {
        $courses = mysql_query("SELECT * FROM `".$_SESSION['prefix']."course` WHERE User_Key='".$_SESSION['User_Key']."' ORDER BY Course_Name");
        $json = "";
        while($c = mysql_fetch_array($courses)) {
            if (strlen($json)) { $json.=","; }
            $json.='"'.$c["Course_Name"].'"';
        }
    }
    else {
        $courses = mysql_query("SELECT * FROM `".$_SESSION['prefix']."course` WHERE User_Key='".$_SESSION['User_Key']."' AND ".
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
