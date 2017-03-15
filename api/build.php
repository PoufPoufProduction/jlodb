<?php

include_once "database.php";
include "_insert.php";

if (!$error) {
    $lang               = ($_GET["lang"]?$_GET["lang"]:"fr-FR");

    // CHECK IF THE CALLER IS LOGGED AS ADMIN
    if (!$_SESSION['admin']) {
        $textstatus = "operation is not authorized";
        $error = 100;
    }
    else {
        if (strlen($_GET["filename"])==0 || strlen($_GET["activity"])==0) {
            $textstatus = "parameter 'filename' or 'activity' is missing";
            $error = 11;
        }
        else {
            $result = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."activity` WHERE `Activity_Name`='".$_GET["activity"]."'");
			if ($result) {
				while ($row = mysqli_fetch_array($result)) {
					insertIntoDB($link,$row["Activity_Name"],$row["Activity_Key"],$_GET["filename"],$lang,$warnings,$tags,true);
					$status = "success";
				}
			}
        }
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo $config;
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
echo '  "from" : "jlodb/api" }';

?>
