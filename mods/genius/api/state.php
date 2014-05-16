<?php
$apipath = "../../../api/";
include $apipath."database.php";

if (!$error) {

    // GET THE INITIAL STATE OF THE NODES ACCORDING TO THEIR Node_Level
    // NODES ARE CODED ON 2 bits (0: Open, 1:Finished)
    // THAT DOES 4 NODES BY BYTE AND 3 NODES BY BASE64 CODED BYTE
    $nodes = "";
    $node = mysql_query("SELECT * FROM `".$_SESSION['prefix']."node` ORDER BY `Node_Id` DESC");
    while($n = mysql_fetch_array($node)) {
        if (!strlen($nodes)) { for ($i=0; $i<ceil($n["Node_Id"]/(6*4))*6; $i++) { $nodes.=chr(0); } }
        if ($n["Node_Level"]) {
            $byte   = floor($n["Node_Id"]/4);
            $value  = 1<<((3-$n["Node_Id"]%4)*2);
            $nodes[$byte]= chr(ord($nodes[$byte])|$value);
        }
    }
    $nodes64 = base64_encode($nodes);

    $status = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
echo '  "textStatus" : "'.$textstatus.'",';
if ($error)     { echo '  "error" : '.$error; } else {
echo '  "nodes": "'.$nodes64.'"';
}
echo '}';

?> 
