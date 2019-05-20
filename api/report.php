<?php

include "database.php";

if (!$error) {
	if (array_key_exists("action",$_GET)) {
		if ( $_GET["action"]=="new") {
		
			if (array_key_exists("id",$_POST)) 					{ $id=$_POST["id"]; }
			if (array_key_exists("classification",$_POST)) 		{ $classification=$_POST["classification"]; }
			if (array_key_exists("diff",$_POST)) 				{ $diff=$_POST["diff"]; }
			if (array_key_exists("level",$_POST)) 				{ $level=$_POST["level"]; }
			if (array_key_exists("extend",$_POST)) 				{ $extend=$_POST["extend"]; }
			if (array_key_exists("label",$_POST)) 				{ $label=$_POST["label"]; }
			if (array_key_exists("comment",$_POST)) 			{ $comment=$_POST["comment"]; }
			
			mysqli_query($link, "INSERT INTO `".$_SESSION['prefix']."report` (`Report_Exercice`,`Report_Description`, `Report_State`, `Report_Title`, `Report_Level`, `Report_Difficulty`, `Report_Classification`, `Report_Duration`, `Report_Date`) VALUES ('".
                $id."','".$comment."',0,'".$label."',".$level.",".$diff.",'".$classification."',".$extend.", NOW() )");
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
echo '  "from" : "jlodb/api" }';

?>
