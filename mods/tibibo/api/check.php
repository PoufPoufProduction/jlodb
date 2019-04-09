<?php
$apipath = "../../";
include_once $apipath."../api/database.php";

if (!$error) {

    
		
	$a=mysqli_query($link, "SELECT count(`Book_Name`) FROM `".$_SESSION['prefix']."book`");
    $nb=mysqli_fetch_array($a);

    $status = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))             { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)    { echo '  "error" : '.$error.','; }
if (isset($nb))         		{ echo '  "nbcourses" : '.$nb[0].','; }
else 							{ echo '  "nbcourses": -1,'; }
echo '  "from" : "mods/tibibi/api" }';


?>
