<?php
include_once "../../api/database.php";
include_once "check.php";

if (!$error && strlen($_GET["value"])) {

    $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE ".
                        " `User_Id` = '".$_GET["value"]."' OR ".
                        " CONCAT(`User_FirstName`,' ',`User_LastName`) LIKE '%".$_GET["value"]."%' LIMIT 20");


    // CHECK IF THE FOUND USER IS NOT THE CURRENT USER OR ONE OF HIS FRIENDS
    $json       = "";
    $nbfriends  = 0;
    while(($nbfriends < 50) && ($row = mysql_fetch_array($user)) ) {
        $good = false;
        if ($row["User_Key"]!=$_SESSION['User_Key'] ) {
            $count1 = mysql_fetch_array(mysql_query("SELECT COUNT(`User_Key`) FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "Friend_Key='".$_SESSION['User_Key']."' AND `User_Key`='".$row["User_Key"]."'"));
            $count2 = mysql_fetch_array(mysql_query("SELECT COUNT(`User_Key`) FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "Friend_Key='".$row["User_Key"]."' AND `User_Key`='".$_SESSION['User_Key']."'"));

            $good = ($count1[0]==0 ) && ($count2[0]==0);
        }

        if ($good) {
            $nbfriends++;
            if (strlen($json)) { $json.=","; }
            $json.='{ "id":"'.$row["User_Id"].'","first":"'.$row["User_FirstName"].'",'.
                   '"last":"'.$row["User_LastName"].'","email":"'.$row["User_eMail"].'",'.
                   '"avatar":"'.$row["User_Avatar"].'","tag":"'.$row["User_Tag"].'","key":"'.$row["User_Key"].'"}';
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



