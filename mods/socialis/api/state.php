<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include "check.php";
include $apipath."mods/check.php";

$nb = 0;

if (!$error && $_GET["node"]) {
    if ($_POST["state"]) {
        mysql_query("INSERT INTO `".$_SESSION['prefix']."state` (`User_Id`, `Node_Id`, `State`) ".
                    "VALUES ( '".$_GET["username"]."', '".$_GET["node"]."', '".$_POST["state"]."') ".
                    "ON DUPLICATE KEY UPDATE `State` = '".$_POST["state"]."'");

        $value = $_POST["state"];

        $stars = mysql_query("SELECT * FROM `".$_SESSION['prefix']."state` WHERE `User_Id`='".$_GET["username"]."'");
        while($s = mysql_fetch_array($stars)) {
            $nb += 3*substr_count($s["State"],"5") + 2*substr_count($s["State"],"4") + 1*substr_count($s["State"],"3");
        }
        mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Stars`=".$nb." WHERE `User_Id` = '".$_GET["username"]."'");

    }
    else {
        $genius = mysql_query("SELECT * FROM `".$_SESSION['prefix']."state` WHERE ".
                              "`User_Id`='".$_GET["username"]."' AND `Node_ID`='".$_GET["node"]."'");
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
if ($nb) { echo '  "stars" : "'.$nb.'",'; }
echo '  "state":"'.$value.'"';
echo '}';


?>
