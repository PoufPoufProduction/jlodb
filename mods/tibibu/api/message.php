<?php
$apipath = "../../";
include_once $apipath."../api/database.php";
include $apipath."../user/api/check.php";

$status = "success";
$error = 0;
$textstatus = "";

if (strlen($_SESSION['User_Key']) && $_GET["action"]=="new") {
    $idisfine = false; $len = 5;

    $l = str_replace("'","\'", $_GET["label"]);
    $l = str_replace('"','\"', $l);

    $e = str_replace("'","\'", $_POST["description"]);
    $e = str_replace('"','\"', $e);

    $d = str_replace("'","\'", $_POST["data"]);
    $d = str_replace('"','\"', $d);

    mysql_query("INSERT INTO `".$_SESSION['prefix']."message` (".
                "`User_Key`, `Circle_Key`, `Target_Key`, `Message_Type`, `Message_Label`, `Message_Description`, `Message_Content`) VALUES (".
                "'".$_SESSION['User_Key']."','".$_GET["circle"]."','".$_GET["target"]."','".$_GET["type"]."','".$l."','".$e."','".$d."')");

}
else
if (strlen($_SESSION['User_Key']) && $_GET["action"]=="inbox") {

    $circle = mysql_query("SELECT * FROM `".$_SESSION['prefix']."message` M INNER JOIN ".
                        "`".$_SESSION['prefix']."friendbycircle` C, `".$_SESSION['prefix']."circle` I, `".$_SESSION['prefix']."user` U where ".
                        "C.Friend_Key='".$_SESSION['User_Key']."' AND ".
                        "C.Circle_Key=M.Circle_Key AND M.Circle_Key=I.Circle_Key AND U.User_Key=I.User_Key");
    $target = mysql_query("SELECT * FROM `".$_SESSION['prefix']."message` M INNER JOIN ".
                        "`".$_SESSION['prefix']."user` U where ".
                        "M.Target_Key='".$_SESSION['User_Key']."' AND ".
                        "U.User_Key=M.User_Key");

    $json = "";
    while($c = mysql_fetch_array($circle) ) {
        if (strlen($json)) { $json.=","; }
        $json.= '{"group":1, "id":"'.$c["Message_Key"].'","type":"'.$c["Message_Type"].'","status":"'.$c["Message_Status"].'"'.
                ',"label":"'.$c["Message_Label"].'","user":"'.$c["User_Id"].'","name":"'.$c["User_FirstName"].' '.$c["User_LastName"].'"'.
                ',"date":"'.$c["Message_Date"].'"'.
                '}';
    }
    while($c = mysql_fetch_array($target) ) {
        if (strlen($json)) { $json.=","; }
        $json.= '{"group":0, "id":"'.$c["Message_Key"].'","type":"'.$c["Message_Type"].'","status":"'.$c["Message_Status"].'"'.
                ',"label":"'.$c["Message_Label"].'","user":"'.$c["User_Id"].'","name":"'.$c["User_FirstName"].' '.$c["User_LastName"].'"'.
                ',"date":"'.$c["Message_Date"].'"'.
                '}';
    }
}
else {
    $msg = mysql_query("SELECT * FROM `".$_SESSION['prefix']."message` WHERE Message_Key='".$_GET["value"]."'");
    $description = "";

    $row = mysql_fetch_array($msg);
    if ($row) {
        $value      = $row["Message_Description"];
        $data       = base64_encode($row["Message_Content"]);
        $type       = $row["Message_Type"];
    }
    else {
        $status = "error";
        $error = 10;
        $textstatus = "can not find exercice";
    }
}


// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
if ($value)       { echo ', "value" : "'.$value.'"'; }
if ($data)        { echo ', "data" : "'.$data.'"'; }
if ($type)        { echo ', "type" : "'.$type.'"'; }
if ($json)        { echo ', "messages":['.$json.']'; }
echo '}';


?>
