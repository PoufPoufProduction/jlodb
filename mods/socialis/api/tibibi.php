<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include "check.php";
include $apipath."mods/check.php";

if (!$error) {

    if ($_GET["action"]=="courses") {
        $rc = mysql_query("SELECT * FROM `".$_SESSION['prefix']."course` WHERE User_Id='".$_GET["username"]."' ORDER BY Course_Name");
        $courses = "";
        while($c = mysql_fetch_array($rc)) {
            if (strlen($courses)) { $courses.=","; } $courses.='"'.$c["Course_Name"].'"';
        }
    }
    else if ($_GET["action"]=="upd") {
        mysql_query("UPDATE `".$_SESSION['prefix']."recv` SET `Course_Description`='".$_GET["state"]."' ".
                    "WHERE User_Id='".$_GET["username"]."' AND Recv_Id='".$_GET["value"]."'");

    }
    else if ($_GET["action"]=="new") {
        $rc = mysql_fetch_array(mysql_query("SELECT COUNT(*) FROM `".$_SESSION['prefix']."recv` WHERE User_Id='".$_GET["username"]."' ".
                                            "AND `Course_Description` IS NULL"));
        $value = $rc[0];
    }
    else if ($_GET["action"]=="del") {
        mysql_query("DELETE FROM `".$_SESSION['prefix']."send` WHERE `Send_Id`='".$_GET["value"]."'");
        mysql_query("DELETE FROM `".$_SESSION['prefix']."recv` WHERE `Recv_Id`='".$_GET["value"]."'");
    }
    else if ($_GET["action"]=="data") {
        $rc=mysql_query("SELECT *, R.Course_Description AS d, C.Course_Description AS v FROM `".$_SESSION['prefix']."recv` R INNER JOIN ".
                        "`".$_SESSION['prefix']."send` S, `".$_SESSION['prefix']."course` C , `".$_SESSION['prefix']."user` U ".
                        "WHERE R.Recv_Id='".$_GET["value"]."' AND U.User_Id = R.User_Id ".
                        "AND R.Recv_Id = S.Send_Id AND C.User_Id = S.User_Id AND C.Course_Name = S.Course_Name");
        $courses="";
        while ($r = mysql_fetch_array($rc)) {
            if (strlen($courses)) { $courses.=","; }

            $ex = 0;
            if (strlen($r["d"])) { $ex = strlen($r["d"])-substr_count($r["d"],'.')-substr_count($r["d"],'l'); }
            $all= 0;
            if (strlen($r["v"])) { $all = substr_count($r["v"],',')+1; }

            $courses.='{"id":"'.$r["User_Id"].'","first":"'.$r["User_FirstName"].'","last":"'.$r["User_LastName"].'",'.
                      '"avatar":"'.$r["User_Avatar"].'","done":'.$ex.',"nb":'.$all.',"state":"'.$r["d"].'"'.
                      '}';
        }

    }
    else if ($_GET["action"]=="send") {
        $id = uniqid();

        if ($_GET["group"]=='1') {
            $sql = "SELECT * FROM `".$_SESSION['prefix']."friend` WHERE User_Id='".$_GET["username"]."' ".
                   "AND Group_Name='".$_GET["value"]."' AND Accept=1 And Host=''";
        }
        else {
            $sql = "SELECT * FROM `".$_SESSION['prefix']."friend` WHERE User_Id='".$_GET["username"]."' ".
                   "AND Friend_Id='".$_GET["value"]."' AND Accept=1 And Host=''";
        }
        $rc = mysql_query($sql);
        $student = array();
        while ($s = mysql_fetch_array($rc)) { array_push($student, $s["Friend_Id"]); }

        foreach ($student as $s) {
            mysql_query("INSERT INTO `".$_SESSION['prefix']."recv` (`Recv_Id`,`User_Id`) VALUES ('".$id."','".$s."')");
        }

        if (count($student)) {
            mysql_query("INSERT INTO `".$_SESSION['prefix']."send` ".
                    "(`Send_Id`,`User_Id`, `Course_Name`, `Group_Name`, `Course_Label`, `Deadline`) VALUES ('".
                    $id."','".$_GET["username"]."','".$_GET["course"]."','".($_GET["group"]=='1'?$_GET["value"]:"")."',".
                    "'".$_POST["label"]."','".$_GET["deadline"]."')");
        }

    }
    else if ($_GET["action"]=="details") {
        $rc=mysql_query("SELECT R.Course_Description AS d, C.Course_Description AS v FROM `".$_SESSION['prefix']."recv` R INNER JOIN ".
                        "`".$_SESSION['prefix']."send` S, `".$_SESSION['prefix']."course` C ".
                        "WHERE R.user_Id='".$_GET["username"]."' AND R.Recv_Id='".$_GET["value"]."' ".
                        "AND R.Recv_Id = S.Send_Id AND C.User_Id = S.User_Id AND C.Course_Name = S.Course_Name LIMIT 1");
        if ($c = mysql_fetch_array($rc)) {
            $desc = $c["d"];
            $value = $c["v"];
        }
    }
    else {
        $rc=mysql_query("SELECT * FROM `".$_SESSION['prefix']."send` WHERE User_Id='".$_GET["username"]."'");
        $send = "";
        while ($s = mysql_fetch_array($rc)) {

            $nb = 1;
            if (strlen($s["Group_Name"])) {
                $ret= mysql_fetch_array(mysql_query(
                        "SELECT COUNT(*) FROM `".$_SESSION['prefix']."recv` WHERE RECV_Id='".$s["Send_Id"]."'"));
                $nb = $ret[0];
            }

            if (strlen($send)) { $send.=","; }
            $send.='{"name":"'.$s["Course_Name"].'","label":"'.$s["Course_Label"].'","Finished":"'.$s["Finished"].'",'.
                   '"time":"'.$s["Timestamp"].'","deadline":"'.$s["Deadline"].'","id":"'.$s["Send_Id"].'",'.
                   '"group":"'.$s["Group_Name"].'","nb":"'.$nb.'"}';
        }


        $rc=mysql_query("SELECT *, U.User_Id AS Sender, R.Course_Description AS State, C.Course_Description AS Exo ".
                        "FROM `".$_SESSION['prefix']."recv` R INNER JOIN ".
                        "`".$_SESSION['prefix']."send` S, `".$_SESSION['prefix']."user` U, `".$_SESSION['prefix']."course` C ".
                        "WHERE R.Recv_Id = S.Send_Id AND S.User_Id = U.User_Id AND R.User_Id='".$_GET["username"]."' ".
                        "AND C.Course_Name = S.Course_Name");

        $recv = "";
        while ($r = mysql_fetch_array($rc)) {
            if (strlen($recv)) { $recv.=","; }

            $ex = 0;
            if (strlen($r["State"])) { $ex = strlen($r["State"])-substr_count($r["State"],'.')-substr_count($r["State"],'l'); }
            $all= 0;
            if (strlen($r["Exo"])) { $all = substr_count($r["Exo"],',')+1; }

            $recv.='{"name":"'.$r["Course_Name"].'","label":"'.$r["Course_Label"].'","Finished":"'.$r["Finished"].'",'.
                   '"time":"'.$r["Timestamp"].'","deadline":"'.$r["Deadline"].'",'.
                   '"group":"'.$r["Group_Name"].'","status":['.$ex.','.$all.'],"Masked":"'.$r["Masked"].'",'.
                   '"sender":"'.$r["Sender"].'","last":"'.$r["User_LastName"].'","first":"'.$r["User_FirstName"].'",'.
                   '"avatar":"'.$r["User_Avatar"].'","id":"'.$r["Recv_Id"].'"}';
        }

    }


    $status = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
if ($courses)   { echo ',  "courses" : ['.$courses.']'; }
if ($send)      { echo ',  "send" : ['.$send.']'; }
if ($recv)      { echo ',  "recv" : ['.$recv.']'; }
if ($desc)      { echo ',  "description": "'.$desc.'"'; }
if ($value)     { echo ',  "value": "'.$value.'"'; }
echo '}';


?>
