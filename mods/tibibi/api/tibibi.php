<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include_once $apipath."mods/check.php";

if (!$error) {

    if ($_GET["action"]=="new") {
        $value = $_GET["value"];
        mysql_query("INSERT INTO `".$_SESSION['prefix']."tibibi` (`Tibibi_Name`,`User_Key`) VALUES ('".
                    $_GET["value"]."','".$_SESSION['User_Key']."')");
    }
    else
    if ($_GET["action"]=="upd") {
        $value = $_GET["value"];
        if (!mysql_query("UPDATE `".$_SESSION['prefix']."tibibi` SET `Tibibi_Name`='".$_GET["value"]."' ".
                        "WHERE `Tibibi_Name`='".$_GET["tibibi"]."' AND User_Key='".$_SESSION['User_Key']."'") ) {
            $value = $_GET["tibibi"]; }
    }
    else
    if ($_GET["action"]=="del") {
        mysql_query("DELETE FROM `".$_SESSION['prefix']."tibibi` ".
                        "WHERE `Tibibi_Name`='".$_GET["value"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else {
        $groups = mysql_query("SELECT * FROM `".$_SESSION['prefix']."tibibi` ".
                            "WHERE User_Key='".$_SESSION['User_Key']."' ORDER BY Tibibi_Name");
        $json = "";
        while($g = mysql_fetch_array($groups)) {
            if (strlen($json)) { $json.=","; }
            $json.='"'.$g["Tibibi_Name"].'"';
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
if ($json)        { echo ', "tibibis":['.$json.']'; }
echo '}';


?>
