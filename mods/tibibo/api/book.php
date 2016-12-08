<?php
$apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

$status = "success";
$error = 0;
$textstatus = "";


if (array_key_exists("User_Key",$_SESSION) && $_GET["action"]=="new") {
    $idisfine = false; $len = 5;

    $v = str_replace("'","\'", $_GET["value"]);
    $v = str_replace('"','', $v);

    do {
        $value  = substr(md5(uniqid()),0,$len++);
        $book   = mysql_query("SELECT * FROM `".$_SESSION['prefix']."book` WHERE `Book_Name`='".$value."'");
        $b      = mysql_fetch_array($book);
        if (!$b) { $idisfine = true; }
    } while (!$idisfine);
    
    mysql_query("INSERT INTO `".$_SESSION['prefix']."book` (`Book_Name`,`User_Key`, `Book_Label`, `Book_Description`) VALUES ('".
            $value."','".$_SESSION['User_Key']."','".$v."','')");
}
else
if (array_key_exists("User_Key",$_SESSION) && $_GET["action"]=="upd") {
    if ( array_key_exists("value",$_GET)) {
        
        $v = str_replace("'","\'", $_GET["value"]);
        $v = str_replace('"','', $v);

        mysql_query("UPDATE `".$_SESSION['prefix']."book` SET `Book_Label`='".$v."' ".
                    "WHERE `Book_Name`='".$_GET["book"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if ( array_key_exists("comment",$_POST)) {
        
        $v = str_replace("'","\'", $_POST["comment"]);
        $v = str_replace('"','', $v);

        mysql_query("UPDATE `".$_SESSION['prefix']."book` SET `Book_Comment`='".$v."' ".
                    "WHERE `Book_Name`='".$_GET["book"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if ( array_key_exists("description",$_POST)) {
        $v = str_replace("'","\'", $_POST["description"]);
        
        mysql_query("UPDATE `".$_SESSION['prefix']."book` SET Book_Description='".$v."' ".
                    "WHERE `Book_Name`='".$_GET["book"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    
    $courses = mysql_query("SELECT * FROM `".$_SESSION['prefix']."book` B INNER JOIN `".$_SESSION['prefix']."user` U WHERE ".
                "B.User_Key=U.User_Key AND B.Book_Name='".$_GET["book"]."'");

    while($c = mysql_fetch_array($courses)) {
        $value          = $c["Book_Label"];
        $description    = $c["Book_Description"];
        $comment        = $c["Book_Comment"];
        $owner          = $c["User_Id"];
    }
}
else
if (array_key_exists("User_Key",$_SESSION) && $_GET["action"]=="del") {
    mysql_query("DELETE FROM `".$_SESSION['prefix']."book` WHERE `Book_Name`='".$_GET["value"]."' ".
                        "AND User_Key='".$_SESSION['User_Key']."'");
}
else
if (array_key_exists("User_Key",$_SESSION) && $_GET["action"]=="list") {
    $books = mysql_query("SELECT * FROM `".$_SESSION['prefix']."book` WHERE User_Key='".$_SESSION['User_Key']."' ORDER BY Book_Label");
    $json = "";
    while($c = mysql_fetch_array($books)) {
        if (strlen($json)) { $json.=","; }
        $json.='{"id":"'.$c["Book_Name"].'","label":"'.$c["Book_Label"].'"}';
    }
}
else {
    $courses = mysql_query("SELECT * FROM `".$_SESSION['prefix']."book` B INNER JOIN `".$_SESSION['prefix']."user` U WHERE ".
                "B.User_Key=U.User_Key AND B.Book_Name='".$_GET["value"]."'");
    $description = "";
    while($c = mysql_fetch_array($courses)) {
        $value          = $c["Book_Label"];
        $description    = $c["Book_Description"];
        $comment        = $c["Book_Comment"];
        $owner          = $c["User_Id"];
    }
}


// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
if ($value)       { echo ', "value" : "'.$value.'"'; }
if ($owner)       { echo ', "owner" : "'.$owner.'"'; }
if ($description) { echo ',  "description":'.$description; }
if ($comment)     { echo ',  "comment" : "'.$comment.'"'; }
if ($json)        { echo ',  "books":['.$json.']'; }
echo '}';


?>
