<?php

include "database.php";

if (!$error) {
    $activity = mysql_query("SELECT * FROM `".$_SESSION['prefix']."tags` ORDER BY Tag");
    $json = "";
	if ($activity) {
		while($row = mysql_fetch_array($activity)) {
			if (strlen($json)) { $json.=","; }
			$json.='"'.$row["Tag"].'"';
		}
	}
    $status     = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error)     { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'",';
echo '  "tags" : ['.$json.']';
echo '}';

?>
