<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include_once $apipath."mods/check.php";

if (!$error) {
    if (strlen($_GET["value"])!=0) {
        $value = $_GET["value"];
        mysql_query("REPLACE INTO `".$_SESSION['prefix']."coursebytibibi` (Link_Description,User_Key,Course_Name,Tibibi_Name) ".
                "VALUES ('".$_GET["value"]."','".$_SESSION['User_Key']."','".$_GET["course"]."','".$_GET["tibibi"]."')");
    }
    else {
        $l = mysql_query("SELECT * FROM `".$_SESSION['prefix']."coursebytibibi` WHERE User_Key='".$_SESSION['User_Key']."' ".
                        "AND Course_Name='".$_GET["course"]."' AND Tibibi_Name='".$_GET["tibibi"]."'");
        $description = "";
        if ($l) {
            $c = mysql_fetch_array($l);
            $description = $c["Link_Description"];
        }
    }
    $status = "success";

}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
if ($description) { echo ',  "description":"'.$description.'"'; }
if ($value)       { echo ',  "value":"'.$value.'"'; }
echo '}';


?>
