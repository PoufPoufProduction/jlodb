<?php
include_once "../database.php";
include "check.php";

if (!$error && strlen($_GET["value"])) {

    $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE ".
                        " `User_Id` = '".$_GET["value"]."' OR ".
                        " CONCAT(`User_FirstName`,' ',`User_LastName`) LIKE '%".$_GET["value"]."%' LIMIT 50");

    $json = "";
    while($row = mysql_fetch_array($user)) {
        if ($row["User_Id"]!=$_GET["username"]) {
            if (strlen($json)) { $json.=","; }
            $json.='{ "id":"'.$row["User_Id"].'","first":"'.$row["User_FirstName"].'",'.
                '"last":"'.$row["User_LastName"].'","email":"'.$row["User_eMail"].'",'.
                '"avatar":"'.$row["User_Avatar"].',"stars":"'.$row["User_Stars"].'"}';
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

