<?php
include_once "../../api/database.php";
include "check.php";

if (!$error) {
    $FIELDS="";

    if (array_key_exists("last",$_GET)) {
        if (strlen($FIELDS)) { $FIELDS.=",";  }
        $FIELDS.="`User_LastName`='".$_GET["last"]."'";
    }

    if (array_key_exists("first",$_GET)) {
        if (strlen($FIELDS)) { $FIELDS.=",";  }
        $FIELDS.="`User_FirstName`='".$_GET["first"]."'";
    }

    if (array_key_exists("email",$_GET)) {
        if (strlen($FIELDS)) { $FIELDS.=",";  }
        $FIELDS.="`User_eMail`='".$_GET["email"]."'";
    }

    if (array_key_exists("avatar",$_GET)) {
        if (strlen($FIELDS)) { $FIELDS.=",";   }
        $FIELDS.="`User_Avatar`='".$_GET["avatar"]."'";
    }

    if (array_key_exists("theme",$_GET)) {
        if (strlen($FIELDS)) { $FIELDS.=",";   }
        $FIELDS.="`User_Theme`='".$_GET["theme"]."'";
    }

    if (array_key_exists("old",$_GET)) {
        if (strcmp($u['User_Password'],md5($_GET["old"]))) { $error = 104; $textstatus="Wrong old password"; } else {

            if (strlen($_GET["new"])==0 || strlen($_GET["con"])==0 || strcmp($_GET["new"],$_GET["con"])) {
                $error = 105; $textstatus="New password error";
            }
            else {
                if (strlen($FIELDS)) { $FIELDS.=",";  }
                $FIELDS.="User_Password='".md5($_GET["new"])."'";
            }

        }
    }

    if (!$error) {
        $sql = "UPDATE `".$_SESSION['prefix']."user` SET ".$FIELDS." WHERE `User_Key` = '".$_SESSION['User_Key']."'";
        if (mysqli_query($link, $sql)) { $status = "success"; }
    }

}

include "login.php";

?>

