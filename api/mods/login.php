<?php
include_once "../database.php";

$id = "";
if (!$error && strlen($_GET["username"])) {
    $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE `User_Id` = '".$_GET["username"]."'");
    $u = mysql_fetch_array($user);
    if ($u) {

        $param = ',"avatar":"'.$u["User_Avatar"].'", "first":"'.$u["User_FirstName"].'",'.
                 ' "last":"'.$u["User_LastName"].'", "email":"'.$u["User_eMail"].'",'.
                 ' "theme":"'.$u["User_Theme"].'"';

        if (strlen($_GET["password"])) {
            if (strcmp($u['User_Password'],md5($_GET["password"]))==0)
            {
                $id = md5(uniqid());
                mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Date`=NOW(), ".
                    "`User_Code` = '".$id."' WHERE `User_Id` = '".$u["User_Id"]."'");
                $status = "success";
            }
        }
        else if (strlen($_GET["code"])) {
            if (strcmp($u['User_Code'],$_GET["code"])==0)
            {
                // TODO: CHECK THE DATE AND REFUSE AFTER ONE DAY
                $id = $_GET["code"];
                mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Date`=NOW() WHERE `User_Id` = '".$u["User_Id"]."'");
                $status = "success";
            }
            else { $error = 103; $textstatus="wrong login"; }
        }
        else {
            // LOGOUT
            mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Code` = '' WHERE `User_Id` = '".$u["User_Id"]."'");
            $status="logout";
            $param = "";
        }
    }
    else { $error = 103; $textstatus="wrong login"; }
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

