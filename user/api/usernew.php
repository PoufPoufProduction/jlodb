<?php
include_once "../../api/database.php";
include_once "_new.php";

if (!$error && array_key_exists("username",$_GET)) {

    if (array_key_exists("password",$_GET) && array_key_exists("confirm",$_GET) && (strcmp($_GET["password"], $_GET["confirm"])==0))
    {
        if (insertNewUser($link, $_GET["username"], $_GET["password"], "", "", "" )) {
            $error = 0;
            $textstatus="new user";
        }
        else {
            $error = 103;
            $textstatus="login already used";
        }
    }
    else {
        $error = 106;
        $textstatus="password confirmation error";
    }

}

include "login.php";

?>

