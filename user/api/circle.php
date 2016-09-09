<?php
$apipath = "../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

if (!$error) {

    if ($_GET["action"]=="new") {
        $value = $_GET["value"];

        mysql_query("INSERT INTO `".$_SESSION['prefix']."circle` (`Circle_Name`,`User_Key`) VALUES ('".
                    $_GET["value"]."','".$_SESSION['User_Key']."')");
    }
    else
    if ($_GET["action"]=="upd") {
        $value = $_GET["value"];
        mysql_query("UPDATE `".$_SESSION['prefix']."circle` SET `Circle_Name`='".$_GET["value"]."' ".
                        "WHERE `Circle_Key`='".$_GET["circle"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if ($_GET["action"]=="del") {
        mysql_query("DELETE FROM `".$_SESSION['prefix']."circle` ".
                    "WHERE `Circle_Key`='".$_GET["value"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if ($_GET["action"]=="link") {
        mysql_query("INSERT INTO `".$_SESSION['prefix']."friendbycircle` (`Circle_Key`,`Friend_Key`) VALUES ('".
                    $_GET["circle"]."','".$_GET["value"]."')");
    }
    else
    if ($_GET["action"]=="unlink") {
        mysql_query("DELETE FROM `".$_SESSION['prefix']."friendbycircle` ".
                    "WHERE `Circle_Key`='".$_GET["circle"]."' AND `Friend_Key`='".$_GET["value"]."'");
    }
    else {
        $orderby = "Circle_Index";
        if (strlen($_GET["orderby"])) { $orderby = $_GET["orderby"]; }

        $groups = mysql_query("SELECT * FROM `".$_SESSION['prefix']."circle` ".
                            "WHERE User_Key='".$_SESSION['User_Key']."' ORDER BY `".$orderby."`");

        $json = "";
        while($g = mysql_fetch_array($groups)) {
            if (strlen($json)) { $json.=","; }
            $json.='{"key":'.$g["Circle_Key"].',"name":"'.$g["Circle_Name"].'"}';
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
if ($json)        { echo ', "circles":['.$json.']'; }
echo '}';


?>
