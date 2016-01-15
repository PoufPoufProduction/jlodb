<?php
include_once "../../api/database.php";
include "check.php";

if (!$error) {
    $FIELDS="";

    if (strlen($_GET["last"])) {
        if (strlen($FIELDS)) { $FIELDS.=",";  }
        $FIELDS.="`User_LastName`='".$_GET["last"]."'";
    }

    if (strlen($_GET["first"])) {
        if (strlen($FIELDS)) { $FIELDS.=",";  }
        $FIELDS.="`User_FirstName`='".$_GET["first"]."'";
    }

    if (strlen($_GET["email"])) {
        if (strlen($FIELDS)) { $FIELDS.=",";  }
        $FIELDS.="`User_eMail`='".$_GET["email"]."'";
    }

    if (strlen($_GET["avatar"])) {
        if (strlen($FIELDS)) { $FIELDS.=",";   }
        $FIELDS.="`User_Avatar`='".$_GET["avatar"]."'";
    }

    if (strlen($_GET["theme"])) {
        if (strlen($FIELDS)) { $FIELDS.=",";   }
        $FIELDS.="`User_Theme`='".$_GET["theme"]."'";
    }

    if (strlen($_GET["old"])) {
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
        if (mysql_query($sql)) { $status = "success"; }
    }

}

include "login.php";

?>

