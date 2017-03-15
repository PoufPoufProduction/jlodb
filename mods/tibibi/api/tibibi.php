<?php
$apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

if (!$error) {

    if (array_key_exists("action",$_GET) && $_GET["action"]=="new") {
        $value = $_GET["value"];
        mysqli_query($link, "INSERT INTO `".$_SESSION['prefix']."tibibi` (`Tibibi_Name`,`User_Key`) VALUES ('".
                    $_GET["value"]."','".$_SESSION['User_Key']."')");
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="upd") {
        $value = $_GET["value"];
        if (!mysqli_query($link, "UPDATE `".$_SESSION['prefix']."tibibi` SET `Tibibi_Name`='".$_GET["value"]."' ".
                        "WHERE `Tibibi_Name`='".$_GET["tibibi"]."' AND User_Key='".$_SESSION['User_Key']."'") ) {
            $value = $_GET["tibibi"]; }
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="del") {
        mysqli_query($link, "DELETE FROM `".$_SESSION['prefix']."tibibi` ".
                        "WHERE `Tibibi_Name`='".$_GET["value"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else {
        $groups = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."tibibi` ".
                            "WHERE User_Key='".$_SESSION['User_Key']."' ORDER BY Tibibi_Name");
        $json = "";
        while($g = mysqli_fetch_array($groups)) {
            if (strlen($json)) { $json.=","; }
            $json.='"'.$g["Tibibi_Name"].'"';
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
if (isset($json))               { echo '  "tibibis":['.$json.'],'; }
echo '  "from" : "mods/tibibi/api" }';


?>
