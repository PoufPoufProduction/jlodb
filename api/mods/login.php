<?php
include_once "../database.php";

$id = "";
if (!$error && strlen($_GET["username"])) {
    $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE `User_Id` = '".$_GET["username"]."'");
    $error = 103; $textstatus="wrong login";
    $param = 0;


    while($u = mysql_fetch_array($user))
    {
        if (strlen($_GET["password"])) {
            if (strcmp($u['User_Password'],md5($_GET["password"]))==0)
            {
                $id = md5(uniqid());
                mysql_query("UPDATE `".$_SESSION['prefix']."user` SET ".
                    "`User_Code` = '".$id."' WHERE `User_Key` = '".$u["User_Key"]."'");
                $status = "success"; $textstatus="login by password"; $error = 0;
            }
        }
        else if (strlen($_GET["code"])) {
            if (strcmp($u['User_Code'],$_GET["code"])==0)
            {
                $id = $_GET["code"];
                $status = "success";  $textstatus="login by code"; $error = 0;
            }
        }
        else {
            // LOGOUT
            mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Code` = '' WHERE `User_Id` = '".$u["User_Id"]."'");
            $status="logout"; $error = 0; $textstatus="logout";  $param=',"logout":true';
        }

        if (!$error && !$param) {
            $param = ',"avatar":"'.$u["User_Avatar"].'", "first":"'.$u["User_FirstName"].'",'.
                 ' "last":"'.$u["User_LastName"].'", "email":"'.$u["User_eMail"].'",'.
                 ' "theme":"'.$u["User_Theme"].'", "key":"'.$u["User_Key"].'", "tag":"'.$u["User_Tag"].'"';
        }
    }

    if ($status=="success") { $_SESSION['User_Date'] = $u["User_Date"]; $_SESSION['User_Code'] = $u["User_Code"]; }
    else                    { $_SESSION['User_Code'] = 0; }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "code": "'.$id.'",';
echo '  "name": "'.$_GET["username"].'"';
if ($param) { echo $param; }
echo '}';


?>

