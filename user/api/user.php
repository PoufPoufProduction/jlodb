<?php
include_once "../../api/database.php";
include_once "check.php";

if (!$error && array_key_exists("value",$_GET)) {

    $user = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."user` WHERE ".
                        " `User_Id` = '".$_GET["value"]."' OR ".
                        " CONCAT(`User_FirstName`,' ',`User_LastName`) LIKE '%".$_GET["value"]."%' LIMIT 20");


    // CHECK IF THE FOUND USER IS NOT THE CURRENT USER OR ONE OF HIS FRIENDS
    $json       = "";
    $nbfriends  = 0;
    while(($nbfriends < 50) && ($row = mysqli_fetch_array($user)) ) {
        $good = false;
        if ($row["User_Key"]!=$_SESSION['User_Key'] ) {
            $count1 = mysqli_fetch_array(mysqli_query($link, "SELECT COUNT(`User_Key`) FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "Friend_Key='".$_SESSION['User_Key']."' AND `User_Key`='".$row["User_Key"]."'"));
            $count2 = mysqli_fetch_array(mysqli_query($link, "SELECT COUNT(`User_Key`) FROM `".$_SESSION['prefix']."friend` WHERE ".
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
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($json))               { echo '  "users" : ['.$json.'],'; }
echo '  "from" : "user/api" }';



?>



