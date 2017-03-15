<?php

// INSERT A NEW USER IN THE DATABASE
function insertNewUser($link, $id, $password, $avatar, $firsname, $lastname)
{
    $md5 = md5($password);

    // GET USERS WITH THE SAME USERNAME
    $user = mysqli_query($link, "SELECT * FROM `".$_SESSION['prefix']."user` WHERE `User_Id` = '".$id."'");
    $good = true;
    $tags = array();

    // CAN'T CREATE USER IF SOMEONE HAS ALREADY THE SAME USERNAME/PASSWORD
    while($u = mysqli_fetch_array($user)) {
        if (!strcmp($u["User_Password"], $md5)) { $good = false; }
        array_push($tags, $u["User_Tag"]);
    }

    // DO NOT ALLOW MORE THAN 8 000 USERS WITH THE SAME USERNAME
    if (count($tags)>8000) { $good = false; }

    if ($good) {
        // FIND AN UNUSED TAG (BETWEEN 1001 AND 9999) 
        do {
            $ok = true;
            $tag = rand(1001,9999);
            foreach ($tags as $t) { if ($t==$tag) { $ok=false; } }
        } while(!$ok);

        // INSERT THE NEW USER
        $good = mysqli_query($link, "INSERT INTO `".$_SESSION['prefix']."user` ".
                    "(`User_Id`, `User_Password`, `User_Avatar`, `User_FirstName`, `User_LastName`, `User_Tag`,`User_Date`) VALUES ".
                    "('".$id."', '".$md5."', '".$avatar."', ".
                    "'".$firsname."', '".ucfirst($lastname)."', ".$tag.", '".date("y-m-d H:i:s")."')");
    }
    return $good;

}


?> 
