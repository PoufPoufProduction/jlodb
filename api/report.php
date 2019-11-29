<?php

include "database.php";

if (!$error) {
	$getlist = true;
	if (array_key_exists("action",$_GET)) {
		if ( $_GET["action"]=="new") {
		
			if (array_key_exists("id",$_POST)) 					{ $id=$_POST["id"]; }
			if (array_key_exists("classification",$_POST)) 		{ $classification=$_POST["classification"]; }
			if (array_key_exists("diff",$_POST)) 				{ $diff=$_POST["diff"]; }
			if (array_key_exists("level",$_POST)) 				{ $level=$_POST["level"]; }
			if (array_key_exists("extend",$_POST)) 				{ $extend=$_POST["extend"]; }
			
			if (array_key_exists("label",$_POST)) { 
				$label=$_POST["label"];
				$label = str_replace("'", "\'", $label);
			}
			if (array_key_exists("comment",$_POST)) {
				$comment=$_POST["comment"];
				$comment = str_replace("'", "\'", $comment);
			}
			
			$sql="INSERT INTO `".$_SESSION['prefix']."report` (`Report_Exercice`,`Report_Description`, `Report_State`, `Report_Title`, `Report_Level`, `Report_Difficulty`, `Report_Classification`, `Report_Duration`, `Report_Date`) VALUES ('".
                $id."','".$comment."',0,'".$label."',".$level.",".$diff.",'".$classification."',".$extend.", NOW() )";
			
			$query = mysqli_query($link,$sql );
			$getlist=false;
		}
		else if ( $_GET["action"]=="del" && array_key_exists("value",$_GET)) {
			mysqli_query($link, "DELETE FROM `".$_SESSION['prefix']."report` WHERE `Report_Id`='".$_GET["value"]."' ");
		}
	}
	else if (array_key_exists("count",$_GET)) {
		$sql = "SELECT COUNT(`Report_Id`) FROM `".$_SESSION['prefix']."report`";  
		$ret 	= mysqli_query($link, $sql);
		$count 	= 0;
		if ($ret) { $count = mysqli_fetch_array($ret); }
		$getlist=false;
	}
	
	if ($getlist)
	{
		$ret 	= mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."report` LIMIT 10");
		$json = "";
        while($row = mysqli_fetch_array($ret)) {
            if (strlen($json)) { $json.=","; }
            $json.='{"id":"'.$row["Report_Id"].'",'.
				'"exercice":"'.$row["Report_Exercice"].'","comment":"'.$row["Report_Description"].'",'.
				'"title":"'.$row["Report_Title"].'",'.'"level":"'.$row["Report_Level"].'",'.
				'"diff":"'.$row["Report_Difficulty"].'",'.'"classification":"'.$row["Report_Classification"].'",'.
				'"duration":"'.$row["Report_Duration"].'",'.'"date":"'.$row["Report_Date"].'"}';
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
if (isset($query))                      { echo '  "query": "'.$query.'",'; }
if (isset($count))                      { echo '  "count": "'.($count?$count[0]:0).'",'; }
if (isset($json))                       { echo '  "reports":[ '.$json.' ],'; }
echo '  "from" : "jlodb/api" }';

?>
