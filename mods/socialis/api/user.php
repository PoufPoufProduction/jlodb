<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include "check.php";
include $apipath."mods/check.php";

if (!$error && strlen($_GET["value"])) {

    $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE ".
                        " `User_Id` = '".$_GET["value"]."' OR ".
                        " CONCAT(`User_FirstName`,' ',`User_LastName`) LIKE '%".$_GET["value"]."%' LIMIT 20");

    $json = "";
    $nbfriends = 0;
    while(($nbfriends < 50) && ($row = mysql_fetch_array($user)) ) {
        if ($row["User_Id"]!=$_GET["username"] || strlen($_GET["host"]) ) {
            $count = mysql_fetch_array(mysql_query("SELECT COUNT(*) FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "Friend_Id='".$_GET["username"]."' AND User_Id='".$row["User_Id"]."' AND Host='".$_GET["host"]."'"));

            if ($count[0]==0 ) {
                $nbfriends++;
                if (strlen($json)) { $json.=","; }
                $json.='{ "id":"'.$row["User_Id"].'","first":"'.$row["User_FirstName"].'",'.
                    '"last":"'.$row["User_LastName"].'","email":"'.$row["User_eMail"].'",'.
                    '"avatar":"'.$row["User_Avatar"].'"}';
            }
        }
    }
    $status ="success";
}


// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "users" : ['.$json.']';
echo '}';


?>

