<?php
$apipath = "../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

if (!$error) {

    $users = 0;

    if (array_key_exists("action",$_GET) && $_GET["action"]=="new" && array_key_exists("value",$_GET)) {
        mysqli_query($link, "INSERT INTO `".$_SESSION['prefix']."friend` (`User_Key`,`Friend_Key`) VALUES ('".
                    $_GET["value"]."','".$_SESSION['User_Key']."')");
    }
    else if (array_key_exists("action",$_GET) && $_GET["action"]=="del") {
        mysqli_query($link, "DELETE FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "User_Key='".$_SESSION['User_Key']."' AND Friend_Key='".$_GET["value"]."'");
        mysqli_query($link, "DELETE FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "User_Key='".$_GET["value"]."' AND Friend_Key='".$_SESSION['User_Key']."'");
    }
    else if (array_key_exists("action",$_GET) && $_GET["action"]=="valid") {
        mysqli_query($link, "UPDATE `".$_SESSION['prefix']."friend` SET Accept=true WHERE ".
                    "User_Key='".$_SESSION['User_Key']."' AND Friend_Key='".$_GET["value"]."'");
        mysqli_query($link, "INSERT INTO `".$_SESSION['prefix']."friend` (`User_Key`,`Friend_Key`,`Accept`) VALUES ('".
                    $_GET["value"]."','".$_SESSION['User_Key']."',true)");
    }
    else if (array_key_exists("action",$_GET) && $_GET["action"]=="waiting") {
        
        $sql = "SELECT * FROM `".$_SESSION['prefix']."friend` F INNER JOIN `".$_SESSION['prefix']."user` U ".
               "WHERE F.Friend_Key='".$_SESSION['User_Key']."'".
               "AND F.User_Key=U.User_Key AND F.Accept=false";
        $users = mysqli_query($link, $sql);
    }
    else {
        if (array_key_exists("circle",$_GET)) {
            $sql = "SELECT * FROM `".$_SESSION['prefix']."friend` F INNER JOIN `".$_SESSION['prefix']."user` U ".
                   "INNER JOIN `".$_SESSION['prefix']."friendbycircle` C ".
                   "WHERE F.User_Key='".$_SESSION['User_Key']."'".
                   "AND F.Friend_Key=U.User_Key AND F.Friend_Key=C.Friend_Key AND C.Circle_Key='".$_GET["circle"]."'";
        }
        else {
            $sql = "SELECT * FROM `".$_SESSION['prefix']."friend` F INNER JOIN `".$_SESSION['prefix']."user` U ".
                   "WHERE F.User_Key='".$_SESSION['User_Key']."'".
                   "AND F.Friend_Key=U.User_Key AND F.Accept=".(($_GET["action"]=="ask")?"false":"true");
        }
        $users = mysqli_query($link, $sql);
    }

    if ($users!=0) {
        $json = "";
        while($row = mysqli_fetch_array($users)) {
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
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($value))              { echo '  "value": "'.$value.'",'; }
if (isset($json))               { echo '  "users" : ['.$json.'],'; }
echo '  "from" : "user/api" }';


?>
