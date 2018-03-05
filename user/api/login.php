<?php
include_once "../../api/database.php";

$id = "";
if (!$error && array_key_exists("username",$_GET)) {
    $user = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."user` WHERE BINARY `User_Id` = '".$_GET["username"]."'");
    $error = 103; $textstatus="wrong login";
    $param = 0;

    $_SESSION['User_Key'] = 0; $_SESSION['User_Code'] = 0;

    while($u = mysqli_fetch_array($user))
    {
        if (array_key_exists("password",$_GET)) {
            $_SESSION['User_DevMode'] = 0;
            if (strcmp($u['User_Password'],md5($_GET["password"]))==0)
            {
                if (array_key_exists("action",$_GET)&&$_GET["action"]=="logout") {
                    mysqli_query($link, "UPDATE `".$_SESSION['prefix']."user` SET `User_Code` = '' WHERE `User_Key` = '".$u["User_Key"]."'");
                    $status="logout"; $error = 0; $textstatus="logout";  $param=',"logout":true';
                }
                else {
                    $id = md5(uniqid());
                    mysqli_query($link, "UPDATE `".$_SESSION['prefix']."user` SET ".
                        "`User_Code` = '".$id."' WHERE `User_Key` = '".$u["User_Key"]."'");
                    $status = "success"; $textstatus="login by password"; $error = 0;
                }
            }
        }
        else if (array_key_exists("code",$_GET)) {
            if (strcmp($u['User_Code'],$_GET["code"])==0)
            {
                if (array_key_exists("action",$_GET) && $_GET["action"]=="logout") {
                    mysqli_query($link, "UPDATE `".$_SESSION['prefix']."user` SET `User_Code` = '' WHERE `User_Key` = '".$u["User_Key"]."'");
                    $_SESSION['User_DevMode'] = 0;
                    $status="logout"; $error = 0; $textstatus="logout";  $param=',"logout":true,"devmode":'.($_SESSION['User_DevMode']?'1':'0');
                }
                else {
                    $id = $_GET["code"];
                    $status = "success";  $textstatus="login by code"; $error = 0;
                }
            }
        }
		else { $_SESSION['User_DevMode'] = 0; }

        // Just the first and only one
        if (!$error && !$param) {
            $param = '"avatar":"'.$u["User_Avatar"].'", "first":"'.$u["User_FirstName"].'",'.
                 ' "last":"'.$u["User_LastName"].'", "email":"'.$u["User_eMail"].'",'.
                 ' "theme":"'.$u["User_Theme"].'", "key":"'.$u["User_Key"].'", "tag":"'.$u["User_Tag"].'", "devmode":'.
				 ((array_key_exists("User_DevMode",$_SESSION)&&$_SESSION['User_DevMode'])?'1':'0');

            $_SESSION['User_Date'] = $u["User_Date"];
            $_SESSION['User_Code'] = $u["User_Code"];
            $_SESSION['User_Key'] = $u["User_Key"];
        }
    }
}
else { $error = 999; $textstatus="username is missing"; }

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))                     { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)            { echo '  "error" : '.$error.','; }
if (isset($textstatus))                 { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($id))                         { echo '  "code": "'.$id.'",'; }
if (array_key_exists("username",$_GET)) { echo '  "name": "'.$_GET["username"].'",'; }
if (isset($param) && $param)            { echo $param.','; }
echo '  "from" : "user/api" }';


?>

