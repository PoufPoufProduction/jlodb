<?php
include_once "../database.php";
include_once "_new.php";

if (!$error && strlen($_GET["username"])) {

    if (strlen($_GET["password"]) && strlen($_GET["confirm"]) && (strcmp($_GET["password"], $_GET["confirm"])==0))
    {
        if (insertNewUser($_GET["username"], $_GET["password"], "", "", "" )) {
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

