<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include "check.php";
include $apipath."mods/check.php";

if (!$error) {

    if ($_GET["action"]=="new" && strlen($_GET["value"])!=0) {
        mysql_query("INSERT INTO `".$_SESSION['prefix']."friend` (`User_Id`,`Friend_Id`,`Host`) VALUES ('".
                    $_GET["value"]."','".$_GET["username"]."','".$_GET["host"]."')");
    }
    else if ($_GET["action"]=="del") {
        mysql_query("DELETE FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "User_Id='".$_GET["username"]."' AND Friend_Id='".$_GET["value"]."' AND Host='".$_GET["pod"]."'");
        if (strlen($_GET["pod"])==0) {
            mysql_query("DELETE FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "User_Id='".$_GET["value"]."' AND Friend_Id='".$_GET["username"]."' AND Host=''");
        }
    }
    else if ($_GET["action"]=="ok") {
        mysql_query("UPDATE `".$_SESSION['prefix']."friend` SET Accept=true WHERE ".
                    "User_Id='".$_GET["username"]."' AND Friend_Id='".$_GET["value"]."' AND Host='".$_GET["pod"]."'");

        if (strlen($_GET["pod"])==0) {
            mysql_query("INSERT INTO `".$_SESSION['prefix']."friend` (`User_Id`,`Friend_Id`,`Accept`) VALUES ('".
                    $_GET["value"]."','".$_GET["username"]."',true)");
            mysql_query("UPDATE `".$_SESSION['prefix']."friend` SET Accept=true WHERE ".
                    "User_Id='".$_GET["value"]."' AND Friend_Id='".$_GET["username"]."' AND Host=''");
        }
    }
    else if ($_GET["action"]=="group") {
        mysql_query("UPDATE `".$_SESSION['prefix']."friend` SET Group_Name='".$_GET["group"]."' WHERE ".
                    "User_Id='".$_GET["username"]."' AND Friend_Id='".$_GET["value"]."' AND Host='".$_GET["pod"]."'");

    }
    else {
        // LOCALE FRIENDS
        $sql = "SELECT * FROM `".$_SESSION['prefix']."friend` F INNER JOIN `".$_SESSION['prefix']."user` U ".
               "WHERE F.User_Id='".$_GET["username"]."' AND F.Host='' ".
               "AND F.Friend_Id=U.User_Id AND F.Accept=".(($_GET["action"]=="ask")?"false":"true");
        $sql .= " AND F.Group_Name".(strlen($_GET["group"])?"='".$_GET["group"]."'":" IS NULL");
        $ask = mysql_query($sql);
        $value = 0;

        $json = "";
        while($row = mysql_fetch_array($ask)) {
            $value++;
             if (strlen($json)) { $json.=","; }
             $json.='{ "id":"'.$row["User_Id"].'","first":"'.$row["User_FirstName"].'",'.
                    '"last":"'.$row["User_LastName"].'","email":"'.$row["User_eMail"].'",'.
                    '"avatar":"'.$row["User_Avatar"].'","stars":'.$row["User_Stars"].'}';
        };

        // TODO: HANDLE EXTERNAL POD FRIENDS
    }


    $status = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
if ($value) { echo ',  "value": "'.$value.'"'; }
if ($json)  { echo ',   "users" : ['.$json.']'; }
echo '}';


?>
