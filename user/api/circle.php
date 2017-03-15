<?php
$apipath = "../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

if (!$error) {

    if (array_key_exists("action",$_GET) && $_GET["action"]=="new") {
        $value = $_GET["value"];

        mysqli_query($link, "INSERT INTO `".$_SESSION['prefix']."circle` (`Circle_Name`,`User_Key`) VALUES ('".
                    $_GET["value"]."','".$_SESSION['User_Key']."')");
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="upd") {
        $value = $_GET["value"];
        mysqli_query($link, "UPDATE `".$_SESSION['prefix']."circle` SET `Circle_Name`='".$_GET["value"]."' ".
                        "WHERE `Circle_Key`='".$_GET["circle"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="del") {
        mysqli_query($link, "DELETE FROM `".$_SESSION['prefix']."circle` ".
                    "WHERE `Circle_Key`='".$_GET["value"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="link") {
        mysqli_query($link, "INSERT INTO `".$_SESSION['prefix']."friendbycircle` (`Circle_Key`,`Friend_Key`) VALUES ('".
                    $_GET["circle"]."','".$_GET["value"]."')");
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="unlink") {
        mysqli_query($link, "DELETE FROM `".$_SESSION['prefix']."friendbycircle` ".
                    "WHERE `Circle_Key`='".$_GET["circle"]."' AND `Friend_Key`='".$_GET["value"]."'");
    }
    else {
        $orderby = "Circle_Index";
        if (array_key_exists("orderby",$_GET)) { $orderby = $_GET["orderby"]; }

        $groups = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."circle` ".
                            "WHERE User_Key='".$_SESSION['User_Key']."' ORDER BY `".$orderby."`");

        $json = "";
        while($g = mysqli_fetch_array($groups)) {
            if (strlen($json)) { $json.=","; }
            $json.='{"key":'.$g["Circle_Key"].',"name":"'.$g["Circle_Name"].'"}';
        }
    }

    $status = "success";

}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($value))              { echo '  "value": "'.$value.'",'; }
if (isset($json))               { echo '  "circles" : ['.$json.'],'; }
echo '  "from" : "user/api" }';


?>
