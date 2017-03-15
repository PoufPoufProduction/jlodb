<?php
$apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

if (!$error) {
    if (array_key_exists("action",$_GET) && $_GET["action"]=="new") {
        if (array_key_exists("value",$_GET)) { $value = $_GET["value"]; }
        mysqli_query($link, "INSERT INTO `".$_SESSION['prefix']."course` (`Course_Name`,`User_Key`, `Course_Description`) VALUES ('".
                $_GET["value"]."','".$_SESSION['User_Key']."','')");
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="upd") {
        if (array_key_exists("value",$_GET)) {
            $value = $_GET["value"];
            if (! mysqli_query($link, "UPDATE `".$_SESSION['prefix']."course` SET `Course_Name`='".$_GET["value"]."' ".
                            "WHERE `Course_Name`='".$_GET["course"]."' AND User_Key='".$_SESSION['User_Key']."'") ) {
                $value = $_GET["course"];
            }
        }
        else {
            mysqli_query($link, "UPDATE `".$_SESSION['prefix']."course` SET Course_Description='".$_GET["description"]."' ".
                        "WHERE `Course_Name`='".$_GET["course"]."' AND User_Key='".$_SESSION['User_Key']."'");
        }
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="del") {
        mysqli_query($link, "DELETE FROM `".$_SESSION['prefix']."course` WHERE `Course_Name`='".$_GET["value"]."' ".
                        "AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="list") {
        $courses = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."course` WHERE User_Key='".$_SESSION['User_Key']."' ORDER BY Course_Name");
        $json = "";
        while($c = mysqli_fetch_array($courses)) {
            if (strlen($json)) { $json.=","; }
            $json.='"'.$c["Course_Name"].'"';
        }
    }
    else {
        $courses = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."course` WHERE User_Key='".$_SESSION['User_Key']."' AND ".
                            "Course_Name='".$_GET["value"]."'");
        $description = "";
        while($c = mysqli_fetch_array($courses)) {
            $description = $c["Course_Description"];
        }
    }
    $status = "success";

}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($value))              { echo '  "value" : "'.$value.'",'; }
if (isset($description))        { echo '  "description":"'.$description.'",'; }
if (isset($json))               { echo '  "courses":['.$json.'],'; }
echo '  "from" : "mods/tibibi/api" }';


?>
