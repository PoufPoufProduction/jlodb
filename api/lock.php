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
			if ($_GET["action"]=="lock")        { mysqli_query($link, "UPDATE `".$_SESSION['prefix']."jlodb` SET `Lock`=true"); }
			else if ($_GET["action"]=="unlock") { mysqli_query($link, "UPDATE `".$_SESSION['prefix']."jlodb` SET `Lock`=false"); }
		}

        $lock = mysqli_query($link, "SELECT `Lock` FROM `".$_SESSION['prefix']."jlodb` LIMIT 1");
        $l = mysqli_fetch_array($lock);

        $status="success";
    }

}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($l))                  { echo '  "lock" : '.$l[0].','; }
echo '  "from" : "jlodb/api" }';

?> 
