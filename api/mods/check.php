<?php
if (!$error) {
    if ( strlen($_GET["username"]) && strlen($_GET["code"] ) ) {
        $ok = false;
        if (strcmp($_SESSION['User_Code'],$_GET["code"])==0 && $_SESSION['User_Key']) {
            $ok = true;
        }
        else {
            $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE ".
                                "`User_Id` = '".$_GET["username"]."' AND `User_Code` = '".$_GET["code"]."' LIMIT 1");

            if ($u = mysql_fetch_array($user)) {
                $_SESSION['User_Date'] = $u["User_Date"];
                $_SESSION['User_Code'] = $u['User_Code'];
                $_SESSION['User_Key']  = $u['User_Key'];
                $ok = true;
            }
            else { $error = 102; $textstatus="identification error"; }
        }

        if ($ok)
        {
            $delay      = floor(time()/(60*60*24)) - floor(strtotime( $_SESSION['User_Date'] )/(60*60*24));

            if ($delay>1) {
                mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Date`='".date("y-m-d H:i:s")."', `User_Days`=1 ".
                            " WHERE `User_Key` = '".$_SESSION['User_Key']."'");
            }
            else if ($delay>0) {
                mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Date`='".date("y-m-d H:i:s")."', `User_Days`=`User_Days`+1 ".
                            " WHERE `User_Key` = '".$_SESSION['User_Key']."'");
            }
            $_SESSION['User_Date'] = date("y-m-d H:i:s");
        }
    }
    else { $error = 102; $textstatus="identification error"; }


}



?>

