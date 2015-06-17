<?php

function insertNewUser($id, $password, $avatar, $firsname, $lastname)
{
    $md5 = md5($password);

    $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE `User_Id` = '".$id."'");
    $good = true;
    $tags = array();

    while($u = mysql_fetch_array($user)) {
        if (!strcmp($u["User_Password"], $md5)) { $good = false; }
        array_push($tags, $u["User_Tag"]);
    }

    if (count($tags)>8000) { $good = false; }

    if ($good) {
        do {
            $ok = true;
            $tag = rand(1001,9999);
            foreach ($tags as $t) { if ($t==$tag) { $ok=false; } }
        } while(!$ok);
        $good = mysql_query("INSERT INTO `".$_SESSION['prefix']."user` ".
                    "(`User_Id`, `User_Password`, `User_Avatar`, `User_FirstName`, `User_LastName`, `User_Tag`,`User_Date`) VALUES ".
                    "('".$id."', '".$md5."', '".$avatar."', ".
                    "'".$firsname."', '".ucfirst($lastname)."', ".$tag.", '".date("y-m-d H:i:s")."')");
    }
    return $good;

}


?> 
