<?php

// CHECK IF USER REALLY LOGGED : TO DO BEFORE ANY OPERATION ON DATABASE
// username AND code VALUES HAVE BEEN SENT AS URL 'GET' ARGUMENTS
if (!$error) {
    if ( strlen($_GET["username"]) && strlen($_GET["code"] ) ) {
        $ok = false;

        // IF CODE MATCHES SESSION CODE, USER IS LOGGED
        if (strcmp($_SESSION['User_Code'],$_GET["code"])==0 && $_SESSION['User_Key']) { $ok = true; }
        else {
            // IF CODE MATCHES DATABASE CODE, USER IS LOGGED
            $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE ".
                                "`User_Id` = '".$_GET["username"]."' AND `User_Code` = '".$_GET["code"]."' LIMIT 1");

            if ($u = mysql_fetch_array($user)) {
                $_SESSION['User_Date'] = $u["User_Date"];
                $_SESSION['User_Code'] = $u['User_Code'];
                $_SESSION['User_Key']  = $u['User_Key'];

                $ok = true;
            }
            // ELSE USER IS NOT LOGGED
            else { $_SESSION['User_Key'] = ""; $error = 102; $textstatus="identification error"; }
        }

        if ($ok)
        {
            // COUNT NUMBER OF SUCCESSIVE DAYS, THE USER HAS BEEN LOGGED
            // NOT USED ANYMORE (GAMIFICATION AND REWARD PURPOSE)
            $delay      = floor(time()/(60*60*24)) - floor(strtotime( $_SESSION['User_Date'] )/(60*60*24));

            if ($delay>1) {
                // MISS A DAY : RESET COUNTER
                mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Date`='".date("y-m-d H:i:s")."', `User_Days`=1 ".
                            " WHERE `User_Key` = '".$_SESSION['User_Key']."'");
            }
            else if ($delay>0) {
                // NEXT DAY
                mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Date`='".date("y-m-d H:i:s")."', `User_Days`=`User_Days`+1 ".
                            " WHERE `User_Key` = '".$_SESSION['User_Key']."'");
            }

            $_SESSION['User_Date'] = date("y-m-d H:i:s");

        }
    }
    else { $_SESSION['User_Key'] = ""; $error = 102; $textstatus="identification error"; }


}



?>

