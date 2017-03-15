<?php
$apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

if (!$error) {
    if (array_key_exists("value",$_GET) && strlen($_GET["value"])!=0) {
        $value = $_GET["value"];
        mysqli_query($link, "REPLACE INTO `".$_SESSION['prefix']."coursebytibibi` (Link_Description,User_Key,Course_Name,Tibibi_Name) ".
                "VALUES ('".$_GET["value"]."','".$_SESSION['User_Key']."','".$_GET["course"]."','".$_GET["tibibi"]."')");
    }
    else {
        $l = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."coursebytibibi` WHERE User_Key='".$_SESSION['User_Key']."' ".
                        "AND Course_Name='".$_GET["course"]."' AND Tibibi_Name='".$_GET["tibibi"]."'");
        $description = "";
        if ($l) {
            $c = mysqli_fetch_array($l);
            $description = $c["Link_Description"];
        }
    }
    $status = "success";

}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($description))        { echo '   "description":"'.$description.'",'; }
if (isset($value))              { echo '   "value":"'.$value.'",'; }
echo '  "from" : "mods/tibibi/api" }';


?>
