<?php
include "database.php";
include "_insert.php";

if (!$error) {

    // CHECK IF THE CALLER IS LOGGED AS ADMIN
    if (!$_SESSION['admin']) {
        $textstatus = "operation is not authorized";
        $error = 100;
    }
    else {
		if (array_key_exists("action",$_GET)) {
			if ($_GET["action"]=="lock")        { mysql_query("UPDATE `".$_SESSION['prefix']."jlodb` SET `Lock`=true"); }
			else if ($_GET["action"]=="unlock") { mysql_query("UPDATE `".$_SESSION['prefix']."jlodb` SET `Lock`=false"); }
		}

        $lock = mysql_query("SELECT `Lock` FROM `".$_SESSION['prefix']."jlodb` LIMIT 1");
        $l = mysql_fetch_array($lock);

        $status="success";
    }

}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "lock" : '.$l[0];
echo '}';


?> 
