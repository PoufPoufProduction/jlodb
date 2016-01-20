<?php
$apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

if (!$error) {
    if ($_GET["action"]=="upd") {
        mysql_query("REPLACE INTO `".$_SESSION['prefix']."tibibo` (`Book_Name`,`User_Key`,`Node_Id`,`Node_State`,`Node_Date`) VALUES (".
            "'".$_GET["book"]."','".$_SESSION['User_Key']."','".$_GET["id"]."','".$_GET["value"]."',NOW() )");
    }
    else
    if ($_GET["action"]=="list") {
        $books = mysql_query("SELECT o.Book_Name, b.Book_Label FROM `".$_SESSION['prefix']."tibibo` o ".
                "INNER JOIN `".$_SESSION['prefix']."book` b WHERE o.Book_Name = b.Book_Name AND ".
                "o.User_Key='".$_SESSION['User_Key']."' GROUP BY o.Book_Name ORDER BY Node_Date DESC");
        $json = "";
        while($c = mysql_fetch_array($books)) {
            if (strlen($json)) { $json.=","; }
            $json.='{"id":"'.$c["Book_Name"].'","label":"'.$c["Book_Label"].'"}';
        }
    }
    else
    if ($_GET["action"]=="look") {
        $books = mysql_query("SELECT o.Book_Name, b.Book_Label, o.Node_Id, o.User_Key, u.User_Id, u.User_FirstName, u.User_LastName, u.User_Tag, ".
              " o.Node_State, o.Node_Date FROM `".$_SESSION['prefix']."tibibo` o ".
                "INNER JOIN `".$_SESSION['prefix']."book` b INNER JOIN `".$_SESSION['prefix']."user` u ".
                "WHERE o.Book_Name = b.Book_Name AND o.User_Key = u.User_Key AND o.Node_Id IN (".$_GET["id"].") ".
                "ORDER BY Node_Date DESC");
        $json = "";
        while($c = mysql_fetch_array($books)) {
            if (strlen($json)) { $json.=","; }
            $json.='{"name":"'.$c["Book_Name"].'","label":"'.$c["Book_Label"].'",'.
                '"id":"'.$c["Node_Id"].'","user":"'.$c["User_Id"].'",'.
                '"first":"'.$c["User_FirstName"].'","last":"'.$c["User_LastName"].'",'.
                '"tag":"'.$c["User_Tag"].'","state":"'.$c["Node_State"].'",'.
                '"date":"'.$c["Node_Date"].'"}';
        }
    }
    else
    if ($_GET["action"]=="del") {
        $courses = mysql_query("DELETE FROM `".$_SESSION['prefix']."tibibo`  WHERE ".
                    "Book_Name='".$_GET["book"]."' AND Node_Id='".$_GET["id"]."'");
    }
    else {
        $courses = mysql_query("SELECT * FROM `".$_SESSION['prefix']."tibibo`  WHERE ".
                    "User_Key='".$_SESSION['User_Key']."' AND Book_Name='".$_GET["book"]."' AND Node_Id='".$_GET["id"]."'");
        $description = "";
        while($c = mysql_fetch_array($courses)) {
            $value = $c["Node_State"];
        }
    }
    $status = "success";
    $textstatus = "";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
if ($value)       { echo ', "value" : "'.$value.'"'; }
if ($json)       { echo ', "description" : ['.$json.']'; }
echo '}';


?>
