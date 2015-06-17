<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include_once $apipath."mods/check.php";

if (!$error) {

    if ($_GET["action"]=="new" && strlen($_GET["value"])!=0) {
        mysql_query("INSERT INTO `".$_SESSION['prefix']."friend` (`User_Key`,`Friend_Key`,`Host`) VALUES ('".
                    $_GET["value"]."','".$_SESSION['User_Key']."','".$_GET["host"]."')");
    }
    else if ($_GET["action"]=="del") {
        mysql_query("DELETE FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "User_Key='".$_SESSION['User_Key']."' AND Friend_Key='".$_GET["value"]."' AND Host='".$_GET["pod"]."'");
        if (strlen($_GET["pod"])==0) {
            mysql_query("DELETE FROM `".$_SESSION['prefix']."friend` WHERE ".
                    "User_Key='".$_GET["value"]."' AND Friend_Key='".$_SESSION['User_Key']."' AND Host=''");
        }
    }
    else if ($_GET["action"]=="ok") {
        mysql_query("UPDATE `".$_SESSION['prefix']."friend` SET Accept=true WHERE ".
                    "User_Key='".$_SESSION['User_Key']."' AND Friend_Key='".$_GET["value"]."' AND Host='".$_GET["pod"]."'");

        if (strlen($_GET["pod"])==0) {
            mysql_query("INSERT INTO `".$_SESSION['prefix']."friend` (`User_Key`,`Friend_Key`,`Accept`) VALUES ('".
                    $_GET["value"]."','".$_SESSION['User_Key']."',true)");
            mysql_query("UPDATE `".$_SESSION['prefix']."friend` SET Accept=true WHERE ".
                    "User_Key='".$_GET["value"]."' AND Friend_Key='".$_SESSION['User_Key']."' AND Host=''");
        }
    }
    else if ($_GET["action"]=="group") {
        mysql_query("UPDATE `".$_SESSION['prefix']."friend` SET Group_Name='".$_GET["group"]."' WHERE ".
                    "User_Key='".$_SESSION['User_Key']."' AND Friend_Key='".$_GET["value"]."' AND Host='".$_GET["pod"]."'");

    }
    else {
        // LOCALE FRIENDS
        $sql = "SELECT * FROM `".$_SESSION['prefix']."friend` F INNER JOIN `".$_SESSION['prefix']."user` U ".
               "WHERE F.User_Key='".$_SESSION['User_Key']."' AND F.Host='' ".
               "AND F.Friend_Key=U.User_Key AND F.Accept=".(($_GET["action"]=="ask")?"false":"true");
        $sql .= " AND F.Group_Name".(strlen($_GET["group"])?"='".$_GET["group"]."'":" IS NULL");
        $ask = mysql_query($sql);
        $value = 0;
        $nbrows = mysql_num_rows($ask);

        $json = "";
        while($row = mysql_fetch_array($ask)) {
            $pinned = 0;
            if ($nbrows<20) {
                $badge = mysql_query("SELECT `Award_Id` FROM `".$_SESSION['prefix']."reward` ".
                                    "WHERE User_Key='".$row["User_Key"]."' AND `Pinned`=true");
                $pin = 0;
                if ($b = mysql_fetch_array($badge)) { $pin=$b[0]; }
            }


            $value++;
            if (strlen($json)) { $json.=","; }
            $json.='{ "id":"'.$row["User_Id"].'","first":"'.$row["User_FirstName"].'",'.
                    '"last":"'.$row["User_LastName"].'","email":"'.$row["User_eMail"].'",'.
                    '"avatar":"'.$row["User_Avatar"].'","stars":'.$row["User_Stars"].','.
                    '"tag":"'.$row["User_Tag"].'","key":"'.$row["User_Key"].'"';
            if ($pin) { $json.=',"pin":"'.$pin.'"'; }
            $json.='}';
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
