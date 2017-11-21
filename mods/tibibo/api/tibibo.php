<?php
$apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

if (!$error) {
    if (array_key_exists("action",$_GET) && $_GET["action"]=="upd") {
        mysqli_query($link, "REPLACE INTO `".$_SESSION['prefix']."tibibo` (`Book_Name`,`User_Key`,`Node_Id`,`Node_State`,`Node_Date`) VALUES (".
            "'".$_GET["book"]."','".$_SESSION['User_Key']."','".$_GET["id"]."','".$_GET["value"]."',NOW() )");
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="list") {
        $list = mysqli_query($link, "SELECT o.Book_Name, b.Book_Label FROM `".$_SESSION['prefix']."tibibo` o ".
                "INNER JOIN `".$_SESSION['prefix']."book` b WHERE o.Book_Name = b.Book_Name AND ".
                "o.User_Key='".$_SESSION['User_Key']."' GROUP BY o.Book_Name ORDER BY Node_Date DESC");
        $books = "";
        while($c = mysqli_fetch_array($list)) {
            if (strlen($books)) { $books.=","; }
            $books.='{"id":"'.$c["Book_Name"].'","label":"'.$c["Book_Label"].'"}';
        }
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="look") {
        $books = mysqli_query($link, "SELECT o.Book_Name, b.Book_Label, o.Node_Id, o.User_Key, u.User_Id, u.User_FirstName, u.User_LastName, u.User_Tag, ".
              " o.Node_State, o.Node_Date FROM `".$_SESSION['prefix']."tibibo` o ".
                "INNER JOIN `".$_SESSION['prefix']."book` b INNER JOIN `".$_SESSION['prefix']."user` u ".
                "WHERE o.Book_Name = b.Book_Name AND o.User_Key = u.User_Key AND o.Node_Id IN (".$_GET["id"].") ".
                "ORDER BY Node_Date DESC");
        $json = "";
        while($c = mysqli_fetch_array($books)) {
            if (strlen($json)) { $json.=","; }
            $json.='{"name":"'.$c["Book_Name"].'","label":"'.$c["Book_Label"].'",'.
                '"id":"'.$c["Node_Id"].'","user":"'.$c["User_Id"].'",'.
                '"first":"'.$c["User_FirstName"].'","last":"'.$c["User_LastName"].'",'.
                '"tag":"'.$c["User_Tag"].'","state":"'.$c["Node_State"].'",'.
                '"date":"'.$c["Node_Date"].'"}';
        }
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="del") {
        $courses = mysqli_query($link, "DELETE FROM `".$_SESSION['prefix']."tibibo`  WHERE ".
                    "Book_Name='".$_GET["book"]."' AND Node_Id='".$_GET["id"]."'");
    }
    else
    if (array_key_exists("action",$_GET) && $_GET["action"]=="all") {
        $courses = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."tibibo`  WHERE ".
                    "User_Key='".$_SESSION['User_Key']."' AND Book_Name='".$_GET["book"]."'");
        $state = "";
        while($c = mysqli_fetch_array($courses)) {
            if (strlen($state)) { $state.=","; }
            $state.='"'.$c["Node_Id"].'":"'.$c["Node_State"].'"';
        }
    }
    else {
        $courses = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."tibibo`  WHERE ".
                    "User_Key='".$_SESSION['User_Key']."' AND Book_Name='".$_GET["book"]."' AND Node_Id='".$_GET["id"]."'");
        $description = "";
        while($c = mysqli_fetch_array($courses)) {
            $value = $c["Node_State"];
        }
    }
    $status = "success";
    $textstatus = "";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && ($error))  { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($value))              { echo '  "value" : "'.$value.'",'; }
if (isset($books))              { echo '  "books":['.$books.'],'; }
if (isset($json))               { echo '  "description":['.$json.'],'; }
if (isset($state))              { echo '  "state" : {'.$state.'},'; }
echo '  "from" : "mods/tibibo/api" }';

?>
