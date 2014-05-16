<?php

if (!$error) {
    if ( strlen($_GET["username"]) && strlen($_GET["code"] ) ) {
        $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE `User_Id` = '".$_GET["username"]."'");
        $u = mysql_fetch_array($user);
        if (strcmp($u['User_Code'],$_GET["code"]))  { $error = 102; $textstatus="identification error";}
    }
    else { $error = 102; $textstatus="identification error"; }
}

?>

