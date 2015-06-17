<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include_once $apipath."mods/check.php";

if (!$error) {
    if ($_POST["genius"]) {
        mysql_query("INSERT INTO `".$_SESSION['prefix']."genius` (`User_Key`, `Genius`) ".
                    "VALUES ( '".$_SESSION['User_Key']."', '".$_POST["genius"]."') ".
                    "ON DUPLICATE KEY UPDATE `Genius` = '".$_POST["genius"]."'");

        $value = $_POST["genius"];
    }
    else {

        if (strlen($_GET["value"])) {

            //TODO : check if value and username are friends

            $genius = mysql_query("SELECT * FROM `".$_SESSION['prefix']."genius` WHERE `User_Key`='".$_GET["value"]."'");
            $g = mysql_fetch_array($genius);
            $value = $g["Genius"];
        }
        else {
            $genius = mysql_query("SELECT * FROM `".$_SESSION['prefix']."genius` WHERE `User_Key`='".$_SESSION['User_Key']."'");
            $g = mysql_fetch_array($genius);
            $value = $g["Genius"];
        }
        }

    $status = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "genius":"'.$value.'"';
echo '}';


?>
