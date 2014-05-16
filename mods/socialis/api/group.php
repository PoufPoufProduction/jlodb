<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include "check.php";

if (!$error) {

    if ($_GET["action"]=="new") {
        $value = $_GET["value"];

        $indexes = mysql_query("SELECT * FROM `".$_SESSION['prefix']."group` ".
                            "WHERE User_Id='".$_GET["username"]."' ORDER BY `Group_Index` DESC LIMIT 1");
        $i = mysql_fetch_array($indexes);
        $index = $i["Group_Index"]+1;

        mysql_query("INSERT INTO `".$_SESSION['prefix']."group` (`Group_Name`,`User_Id`, `Group_Index`) VALUES ('".
                    $_GET["value"]."','".$_GET["username"]."',".$index.")");
    }
    else
    if ($_GET["action"]=="up") {
        $indexes = mysql_query("SELECT * FROM `".$_SESSION['prefix']."group` ".
                    "WHERE `Group_Name`='".$_GET["value"]."' AND `User_Id`='".$_GET["username"]."' LIMIT 1");
        $i = mysql_fetch_array($indexes);

        if ($i["Group_Index"]>1) {
            mysql_query("UPDATE `".$_SESSION['prefix']."group` SET `Group_Index`=".$i["Group_Index"]." ".
                        "WHERE `Group_Index`=".($i["Group_Index"]-1)." AND User_Id='".$_GET["username"]."'");
            mysql_query("UPDATE `".$_SESSION['prefix']."group` SET `Group_Index`=".($i["Group_Index"]-1)." ".
                    "WHERE `Group_Name`='".$_GET["value"]."' AND `User_Id`='".$_GET["username"]."'");
        }

    }
    else
    if ($_GET["action"]=="down") {
        $indexes = mysql_query("SELECT * FROM `".$_SESSION['prefix']."group` ".
                    "WHERE `Group_Name`='".$_GET["value"]."' AND `User_Id`='".$_GET["username"]."' LIMIT 1");
        $i = mysql_fetch_array($indexes);

        $maxindexes = mysql_query("SELECT * FROM `".$_SESSION['prefix']."group` ".
                            "WHERE User_Id='".$_GET["username"]."' ORDER BY `Group_Index` DESC LIMIT 1");
        $m = mysql_fetch_array($maxindexes);

        if ($i["Group_Index"]<$m["Group_Index"]) {
            mysql_query("UPDATE `".$_SESSION['prefix']."group` SET `Group_Index`=".$i["Group_Index"]." ".
                        "WHERE `Group_Index`=".($i["Group_Index"]+1)." AND User_Id='".$_GET["username"]."'");
            mysql_query("UPDATE `".$_SESSION['prefix']."group` SET `Group_Index`=".($i["Group_Index"]+1)." ".
                    "WHERE `Group_Name`='".$_GET["value"]."' AND `User_Id`='".$_GET["username"]."'");
        }

    }
    else
    if ($_GET["action"]=="upd") {
        $value = $_GET["value"];
        mysql_query("UPDATE `".$_SESSION['prefix']."group` SET `Group_Name`='".$_GET["value"]."' ".
                        "WHERE `Group_Name`='".$_GET["group"]."' AND User_Id='".$_GET["username"]."'");

        mysql_query("UPDATE `".$_SESSION['prefix']."friend` SET Group_Name='".$_GET["value"]."' WHERE ".
                    "User_Id='".$_GET["username"]."' AND Group_Name='".$_GET["group"]."'");

        mysql_query("UPDATE `".$_SESSION['prefix']."send` SET Group_Name='".$_GET["value"]."' WHERE ".
                    "User_Id='".$_GET["username"]."' AND Group_Name='".$_GET["group"]."'");
    }
    else
    if ($_GET["action"]=="del") {
        $indexes = mysql_query("SELECT * FROM `".$_SESSION['prefix']."group` ".
                    "WHERE `Group_Name`='".$_GET["value"]."' AND `User_Id`='".$_GET["username"]."' LIMIT 1");
        $i = mysql_fetch_array($indexes);

        mysql_query("DELETE FROM `".$_SESSION['prefix']."group` ".
                    "WHERE `Group_Name`='".$_GET["value"]."' AND User_Id='".$_GET["username"]."'");

        mysql_query("UPDATE `".$_SESSION['prefix']."group` SET Group_Index = Group_Index-1 WHERE ".
                    "`User_Id`='".$_GET["username"]."' AND Group_Index>".$i["Group_Index"]);

        mysql_query("UPDATE `".$_SESSION['prefix']."friend` SET Group_Name=NULL WHERE ".
                    "User_Id='".$_GET["username"]."' AND Group_Name='".$_GET["value"]."'");

    }
    else {
        $groups = mysql_query("SELECT * FROM `".$_SESSION['prefix']."group` ".
                            "WHERE User_Id='".$_GET["username"]."' ORDER BY `Group_Index`");
        $json = "";
        while($g = mysql_fetch_array($groups)) {
            if (strlen($json)) { $json.=","; }
            $json.='"'.$g["Group_Name"].'"';
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
if ($json)        { echo ', "groups":['.$json.']'; }
echo '}';


?>
