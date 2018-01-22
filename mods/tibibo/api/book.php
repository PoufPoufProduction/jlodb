<?php
$apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

$status = "success";
$error = 0;
$textstatus = "";


if (array_key_exists("User_Key",$_SESSION) && array_key_exists("action",$_GET) && $_GET["action"]=="new") {
    $idisfine = false; $len = 5;

    $v = str_replace("'","\'", $_GET["value"]);
    $v = str_replace('"','', $v);

    do {
        $value  = substr(md5(uniqid()),0,$len++);
        $book   = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."book` WHERE `Book_Name`='".$value."'");
        $b      = mysqli_fetch_array($book);
        if (!$b) { $idisfine = true; }
    } while (!$idisfine);
    
    mysqli_query($link, "INSERT INTO `".$_SESSION['prefix']."book` (`Book_Name`,`User_Key`, `Book_Label`, `Book_Description`) VALUES ('".
            $value."','".$_SESSION['User_Key']."','".$v."','')");
}
else
if (array_key_exists("User_Key",$_SESSION) && array_key_exists("action",$_GET) && $_GET["action"]=="upd") {
    if ( array_key_exists("value",$_GET)) {
        
        $v = str_replace("'","\'", $_GET["value"]);
        $v = str_replace('"','', $v);

        mysqli_query($link, "UPDATE `".$_SESSION['prefix']."book` SET `Book_Label`='".$v."' ".
                    "WHERE `Book_Name`='".$_GET["book"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if ( array_key_exists("comment",$_POST)) {
        
        $v = str_replace("'","\'", $_POST["comment"]);
        $v = str_replace('"','', $v);

        mysqli_query($link, "UPDATE `".$_SESSION['prefix']."book` SET `Book_Comment`='".$v."' ".
                    "WHERE `Book_Name`='".$_GET["book"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if ( array_key_exists("awards",$_POST)) {
		$v = str_replace("'","\'", $_POST["awards"]);
		
        mysqli_query($link, "UPDATE `".$_SESSION['prefix']."book` SET `Book_Awards`='".$v."' ".
                    "WHERE `Book_Name`='".$_GET["book"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    else
    if ( array_key_exists("description",$_POST)) {
        $v = str_replace("'","\'", $_POST["description"]);
        
        mysqli_query($link, "UPDATE `".$_SESSION['prefix']."book` SET Book_Description='".$v."' ".
                    "WHERE `Book_Name`='".$_GET["book"]."' AND User_Key='".$_SESSION['User_Key']."'");
    }
    
    $courses = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."book` B INNER JOIN `".$_SESSION['prefix']."user` U WHERE ".
                "B.User_Key=U.User_Key AND B.Book_Name='".$_GET["book"]."'");

    while($c = mysqli_fetch_array($courses)) {
        $value          = $c["Book_Label"];
        $description    = $c["Book_Description"];
        $awards         = $c["Book_Awards"];
        $comment        = $c["Book_Comment"];
        $owner          = $c["User_Id"];
        $ownerkey       = $c["User_Key"];
    }
}
else
if (array_key_exists("User_Key",$_SESSION) && array_key_exists("action",$_GET) && $_GET["action"]=="del") {
    mysqli_query($link, "DELETE FROM `".$_SESSION['prefix']."book` WHERE `Book_Name`='".$_GET["value"]."' ".
                        "AND User_Key='".$_SESSION['User_Key']."'");
}
else
if (array_key_exists("User_Key",$_SESSION) && array_key_exists("action",$_GET) && $_GET["action"]=="list") {
    $books = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."book` WHERE User_Key='".$_SESSION['User_Key']."' ORDER BY Book_Label");
    $json = "";
    while($c = mysqli_fetch_array($books)) {
        if (strlen($json)) { $json.=","; }
        $json.='{"id":"'.$c["Book_Name"].'","label":"'.$c["Book_Label"].'"}';
    }
}
else {
    $courses = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."book` B INNER JOIN `".$_SESSION['prefix']."user` U WHERE ".
                "B.User_Key=U.User_Key AND B.Book_Name='".$_GET["value"]."'");
    $description = "";
    
    $value = "notFound";
    $description="[{\"id\":0,\"label\":\"none\",\"description\":\"nlx\",\"children\":[]}]";
    $comment= "notFound";
    $owner = "0";
    $error = 404;
    $bookid = $_GET["value"];
    
    while($c = mysqli_fetch_array($courses)) {
        $value          = $c["Book_Label"];
        $description    = $c["Book_Description"];
        $comment        = $c["Book_Comment"];
        $awards         = $c["Book_Awards"];
        $owner          = $c["User_Id"];
        $ownerkey       = $c["User_Key"];
        $error          = 0;
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))                                 { echo '  "status" : "'.$status.'",'; }
if (isset($error) && ($error))                      { echo '  "error" : '.$error.','; }
if (isset($textstatus))                             { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($value))                                  { echo '  "value" : "'.$value.'",'; }
if (isset($owner))                                  { echo '  "owner" : "'.$owner.'",'; }
if (isset($ownerkey))                               { echo '  "ownerkey" : "'.$ownerkey.'",'; }
if (isset($description) && strlen($description) )   { echo '  "description":'.$description.','; }
if (isset($comment))                                { echo '  "comment" : "'.$comment.'",'; }
if (isset($awards) && strlen($awards) )             { echo '  "awards":'.$awards.','; }
if (isset($bookid))                                 { echo '  "id" : "'.$bookid.'",'; }
if (isset($json))                                   { echo '  "books":['.$json.'],'; }
echo '  "from" : "mods/tibibo/api" }';


?>
