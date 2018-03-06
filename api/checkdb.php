<?php
$forceReadFile = (array_key_exists("clean",$_GET));
include_once "database.php";

if (!$error) {
    $result = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."jlodb` LIMIT 1");

    if ($result) {
        $row = mysqli_fetch_array($result);

        $lock = false;
        if ($row["Lock"]) {
            $error = 4;
            $textstatus = "Database is locked";
            $lock = true;
        }
        else { $status = "success"; }

        $a=mysqli_query($link, "SELECT count(*) FROM `".$_SESSION['prefix']."activity`");
        $b=mysqli_fetch_array($a);
        $a=mysqli_query($link, "SELECT count(*) FROM `".$_SESSION['prefix']."exercice`");
        $c=mysqli_fetch_array($a);
		
		$user	= (mysqli_query($link, "SELECT 1 FROM `".$_SESSION['prefix']."user` LIMIT 1"));
		$tibibo	= (mysqli_query($link, "SELECT 1 FROM `".$_SESSION['prefix']."tibibo` LIMIT 1"));
		$tibibi	= (mysqli_query($link, "SELECT 1 FROM `".$_SESSION['prefix']."tibibi` LIMIT 1"));
		

        $overview = '"version":"'.$row["Version"].'", "date":"'.$row["Date"].'", "lang":"'.$row["Language"].
                    '", "activities":'.$b[0].', "exercices":'.$c[0].', "lock":'.($lock?"true":"false").', '.
					'"user":'.($user?"true":"false").', '.
					'"tibibo":'.($tibibo?"true":"false").', '.
					'"tibibi":'.($tibibi?"true":"false");

    }
    else {
        $textstatus = $_SESSION['prefix']."jlodb table is missing";
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (isset($status))                     { echo '  "status" : "'.$status.'",'; }
if (isset($error) && $error)     		{ echo '  "error" : '.$error.','; }
if (isset($overview))  	                { echo $overview.','; }
if (array_key_exists("url",$_SESSION)) 	{ echo ' "url" : "'.$_SESSION['url'].'",'; }
if (isset($textstatus))                 { echo '  "textStatus" : "'.$textstatus.'",'; }
echo '  "from" : "jlodb/api" }';

?>
