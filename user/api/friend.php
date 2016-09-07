<?php
$apipath = "../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

if (!$error) {

    $users = 0;

    if ($_GET["action"]=="new" && strlen($_GET["value"])!=0) {
        mysql_query("INSERT INTO `".$_SESSION['prefix']."friend` (`User_Key`,`Friend_Key`) VALUES ('".
                    $_GET["value"]."','".$_SESSION['User_Key']."')");
    }
    else if ($_GET["action"]=="del") {
        mysql_query("DELETE FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "User_Key='".$_SESSION['User_Key']."' AND Friend_Key='".$_GET["value"]."'");
        mysql_query("DELETE FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "User_Key='".$_GET["value"]."' AND Friend_Key='".$_SESSION['User_Key']."'");
    }
    else if ($_GET["action"]=="valid") {
        mysql_query("UPDATE `".$_SESSION['prefix']."friend` SET Accept=true WHERE ".
                    "User_Key='".$_SESSION['User_Key']."' AND Friend_Key='".$_GET["value"]."'");
        mysql_query("INSERT INTO `".$_SESSION['prefix']."friend` (`User_Key`,`Friend_Key`,`Accept`) VALUES ('".
                    $_GET["value"]."','".$_SESSION['User_Key']."',true)");
    }
    else if ($_GET["action"]=="waiting") {
        
        $sql = "SELECT * FROM `".$_SESSION['prefix']."friend` F INNER JOIN `".$_SESSION['prefix']."user` U ".
               "WHERE F.Friend_Key='".$_SESSION['User_Key']."'".
               "AND F.User_Key=U.User_Key AND F.Accept=false";
        $users = mysql_query($sql);
    }
    else {
        $sql = "SELECT * FROM `".$_SESSION['prefix']."friend` F INNER JOIN `".$_SESSION['prefix']."user` U ".
               "WHERE F.User_Key='".$_SESSION['User_Key']."'".
               "AND F.Friend_Key=U.User_Key AND F.Accept=".(($_GET["action"]=="ask")?"false":"true");
        $users = mysql_query($sql);
    }

    if ($users!=0) {
        $json = "";
        while($row = mysql_fetch_array($users)) {
            if (strlen($json)) { $json.=","; }
            $json.='{ "id":"'.$row["User_Id"].'","first":"'.$row["User_FirstName"].'",'.
                    '"last":"'.$row["User_LastName"].'","email":"'.$row["User_eMail"].'",'.
                    '"avatar":"'.$row["User_Avatar"].'","stars":'.$row["User_Stars"].','.
                    '"tag":"'.$row["User_Tag"].'","key":"'.$row["User_Key"].'"}';
        };
    }


    $status = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
if ($value) { echo ',  "value": "'.$value.'"'; }
if ($json)  { echo ',  "users" : ['.$json.']'; }
echo '}';


?>
