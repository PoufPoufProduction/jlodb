<?php

include "database.php";

if (!$error) {
	if (array_key_exists("action",$_GET)) {
		if ( $_GET["action"]=="new") {
		
			if (array_key_exists("email",$_POST)) 		{ $email=$_POST["email"]; }
			if (array_key_exists("data",$_POST)) 		{ $data=$_POST["data"]; }
			if (array_key_exists("activity",$_POST)) 	{ $activity=$_POST["activity"]; }
			if (array_key_exists("description",$_POST)) {
				$description=$_POST["description"];
				$description = str_replace("'", "\'", $description);
			}
			
			$ret = mysqli_query($link, "INSERT INTO `".$_SESSION['prefix']."editor` (`Editor_Email`,`Editor_Activity`, `Editor_Description`, `Editor_Parameters`, `Editor_State`, `Editor_Date`) VALUES ('".
                $email."','".$activity."','".$description."','".$data."',0, NOW() )");			
		}
	}
	$status="success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))                     { echo '  "status" : "'.$status.'",'; }
if (isset($textstatus))                 { echo '  "textStatus" : "'.$textstatus.'",'; }
if (isset($error) && $error)            { echo '  "error" : '.$error; }
if (isset($email))                      { echo '  "email": "'.$email.'",'; }
if (isset($ret))                      	{ echo '  "query": "'.$ret.'",'; }
echo '  "from" : "jlodb/api" }';

?>
