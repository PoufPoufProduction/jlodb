<?php
$apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

$status = "success";
$error = 0;
$textstatus = "";

if (strlen($_SESSION['User_Key']) && $_GET["action"]=="new") {
    $idisfine = false; $len = 5;

    $v = str_replace("'","\'", $_GET["label"]);
    $v = str_replace('"','', $v);

    $d = str_replace("'","\'", $_POST["data"]);
    $d = str_replace('"','', $d);

    do {
        $value  = substr(md5(uniqid()),0,$len++);
        $book   = mysql_query("SELECT * FROM `".$_SESSION['prefix']."file` WHERE `Book_Name`='".$value."'");
        $b      = mysql_fetch_array($book);
        if (!$b) { $idisfine = true; }
    } while (!$idisfine);

    mysql_query("INSERT INTO `".$_SESSION['prefix']."file` (".
                "`File_Name`,`User_Key`, `File_Label`, `File_Description`, `File_Level`, `File_Classification`) VALUES (".
                "'".$value."','".$_SESSION['User_Key']."','".$v."','".$d."','".$_GET["level"]."','".$_GET["classification"]."')");

}
else
if (strlen($_SESSION['User_Key']) && $_GET["action"]=="upd") {

    $FIELDS="";

    if (strlen($_GET["label"])) {
        if (strlen($FIELDS)) { $FIELDS.=",";  }
        $v = str_replace("'","\'", $_GET["label"]);
        $v = str_replace('"','', $v);
        $FIELDS.="`File_Label`='".$v."'";
    }

    if (true) {
        if (strlen($FIELDS)) { $FIELDS.=",";  }
        $d = str_replace("'","\'", $_POST["data"]);
        $d = str_replace('"','', $d);
        $FIELDS.="`File_Description`='".$d."'";
    }

    if (strlen($_GET["level"])) {
        if (strlen($FIELDS)) { $FIELDS.=",";  }
        $FIELDS.="`File_Level`='".$_GET["level"]."'";
    }

    if (strlen($_GET["classification"])) {
        if (strlen($FIELDS)) { $FIELDS.=",";   }
        $FIELDS.="`File_Classification`='".$_GET["classification"]."'";
    }

    if (! mysql_query("UPDATE `".$_SESSION['prefix']."file` SET ".$FIELDS." ".
                    "WHERE `File_Name`='".$_GET["name"]."' AND User_Key='".$_SESSION['User_Key']."'") ) {
        $value = $_GET["name"];
    }
}
else
if (strlen($_SESSION['User_Key']) && $_GET["action"]=="list") {
    $files = mysql_query("SELECT * FROM `".$_SESSION['prefix']."file` F INNER JOIN `".$_SESSION['prefix']."user` U WHERE ".
                "F.User_Key=U.User_Key ORDER BY F.File_Label LIMIT 25");
    $json = "";
    while($c = mysql_fetch_array($files)) {
        if (strlen($json)) { $json.=","; }
        $edit = 0;
        if ($_SESSION['User_Key'] == $c["User_Key"]) { $edit = 1; }
        $json.='{"id":"'.$c["File_Name"].'","label":"'.$c["File_Label"].'","edit":'.$edit.'}';
    }
}
else {
    $courses = mysql_query("SELECT * FROM `".$_SESSION['prefix']."file` B INNER JOIN `".$_SESSION['prefix']."user` U WHERE ".
                "B.User_Key=U.User_Key AND B.File_Name='".$_GET["value"]."'");
    $description = "";
    while($c = mysql_fetch_array($courses)) {
        $value = $c["File_Name"];
        $description = $c["File_Description"];
        $owner = $c["User_Id"];
    }
}


// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
if ($value)       { echo ', "value" : "'.$value.'"'; }
if ($owner)       { echo ', "owner" : "'.$owner.'"'; }
if ($description) { echo ',  "description":"'.$description.'"'; }
if ($json)        { echo ',  "files":['.$json.']'; }
echo '}';


?>
