<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include_once $apipath."mods/check.php";

if (!$error && $_GET["node"]) {
    if ($_POST["state"]) {
        mysql_query("INSERT INTO `".$_SESSION['prefix']."state` (`User_Key`, `Node_Id`, `State`) ".
                    "VALUES ( '".$_SESSION['User_Key']."', '".$_GET["node"]."', '".$_POST["state"]."') ".
                    "ON DUPLICATE KEY UPDATE `State` = '".$_POST["state"]."'");

        $value = $_POST["state"];

    }
    else {
        $genius = mysql_query("SELECT * FROM `".$_SESSION['prefix']."state` WHERE ".
                              "`User_Key`='".$_SESSION['User_Key']."' AND `Node_ID`='".$_GET["node"]."'");
        $g = mysql_fetch_array($genius);
        $value = $g["State"];
    }
    $status = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "state":"'.$value.'"';
echo '}';


?>
