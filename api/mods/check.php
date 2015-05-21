<?php

if (!$error) {
    if ( strlen($_GET["username"]) && strlen($_GET["code"] ) ) {
        $ok = false;
        if (strcmp($_SESSION['User_Code'],$_GET["code"])==0) {
            $ok = true;
        }
        else {
            $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE `User_Id` = '".$_GET["username"]."'");
            $u = mysql_fetch_array($user);
            if (strcmp($u['User_Code'],$_GET["code"]))  { $error = 102; $textstatus="identification error"; }
            else                                        { $_SESSION['User_Date'] = $u["User_Date"];
                                                          $_SESSION['User_Code'] = $u['User_Code']; $ok = true; }
        }

        if ($ok)
        {
            $delay      = floor(time()/(60*60*24)) - floor(strtotime( $_SESSION['User_Date'] )/(60*60*24));

            if ($delay>1) {
                mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Date`=NOW(), `User_Days`=1 ".
                            " WHERE `User_Id` = '".$u["User_Id"]."'");
            }
            else if ($delay>0) {
                mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Date`=NOW(), `User_Days`=`User_Days`+1 ".
                            " WHERE `User_Id` = '".$u["User_Id"]."'");
            }
        }
    }
    else { $error = 102; $textstatus="identification error"; }


}



?>

