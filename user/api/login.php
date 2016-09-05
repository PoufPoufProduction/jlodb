<?php
include_once "../../api/database.php";

$id = "";
if (!$error && strlen($_GET["username"])) {
    $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE `User_Id` = '".$_GET["username"]."'");
    $error = 103; $textstatus="wrong login";
    $param = 0;

    $_SESSION['User_Key'] = 0; $_SESSION['User_Code'] = 0;

    while($u = mysql_fetch_array($user))
    {
        if (strlen($_GET["password"])) {
            $_SESSION['User_DevMode'] = 0;
            if (strcmp($u['User_Password'],md5($_GET["password"]))==0)
            {
                if ($_GET["action"]=="logout") {
                    mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Code` = '' WHERE `User_Key` = '".$u["User_Key"]."'");
                    $status="logout"; $error = 0; $textstatus="logout";  $param=',"logout":true';
                }
                else {
                    $id = md5(uniqid());
                    mysql_query("UPDATE `".$_SESSION['prefix']."user` SET ".
                        "`User_Code` = '".$id."' WHERE `User_Key` = '".$u["User_Key"]."'");
                    $status = "success"; $textstatus="login by password"; $error = 0;
                }
            }
        }
        else if (strlen($_GET["code"])) {
            if (strcmp($u['User_Code'],$_GET["code"])==0)
            {
                if ($_GET["action"]=="logout") {
                    mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Code` = '' WHERE `User_Key` = '".$u["User_Key"]."'");
                    $_SESSION['User_DevMode'] = 0;
                    $status="logout"; $error = 0; $textstatus="logout";  $param=',"logout":true,"devmode":'.($_SESSION['User_DevMode']?'1':'0');
                }
                else {
                    $id = $_GET["code"];
                    $status = "success";  $textstatus="login by code"; $error = 0;
                }
            }
        }

        // Just the first and only one
        if (!$error && !$param) {
            $param = ',"avatar":"'.$u["User_Avatar"].'", "first":"'.$u["User_FirstName"].'",'.
                 ' "last":"'.$u["User_LastName"].'", "email":"'.$u["User_eMail"].'",'.
                 ' "theme":"'.$u["User_Theme"].'", "key":"'.$u["User_Key"].'", "tag":"'.$u["User_Tag"].'", "devmode":'.($_SESSION['User_DevMode']?'1':'0');

            $_SESSION['User_Date'] = $u["User_Date"];
            $_SESSION['User_Code'] = $u["User_Code"];
            $_SESSION['User_Key'] = $u["User_Key"];
        }
    }
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

