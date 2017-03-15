<?php

include "database.php";

if (!$error) {
    $activity = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."tags` ORDER BY Tag");
    $json = "";
	if ($activity) {
		while($row = mysqli_fetch_array($activity)) {
			if (strlen($json)) { $json.=","; }
			$json.='"'.$row["Tag"].'"';
		}
	}
    $status     = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($textstatus))         { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($json))               { echo '  "tags" : ['.$json.'],'; }
echo '  "from" : "jlodb/api" }';

?>
