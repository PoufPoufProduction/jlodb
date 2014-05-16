<?php
include_once "../database.php";

if (!$error && strlen($_GET["username"])) {

    if (strlen($_GET["password"]) && strlen($_GET["confirm"]) && (strcmp($_GET["password"], $_GET["confirm"])==0)) {
        mysql_query("INSERT INTO `".$_SESSION['prefix']."user` (`User_Id`,`User_Password`) VALUES ('".
              $_GET["username"]."','".md5($_GET["confirm"])."')");
    }
    else {
        $error = 106;
        $textstatus="password confirmation error";
    }

}

include "login.php";

?>

