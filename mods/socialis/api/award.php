<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include "check.php";



function getUserStats()
{
    $nbstars = 0;
    $nbnodes = 0;
    $stars = mysql_query("SELECT * FROM `".$_SESSION['prefix']."state` WHERE `User_Id`='".$_GET["username"]."'");
    while($s = mysql_fetch_array($stars)) {
        $nbstars += 3*substr_count($s["State"],"5") + 2*substr_count($s["State"],"4") + 1*substr_count($s["State"],"3");
        $last = substr($s["State"], -1);
        if ($last=='2'||$last=='3'||$last=='4'||$last=='5') { $nbnodes++; }
    }
    mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Stars`=".$nbstars." WHERE `User_Id` = '".$_GET["username"]."'");

    return array($nbstars, $nbnodes);
}

function getPinnedBadge()
{
    $ret = "";
    $badge = mysql_query("SELECT `Award_Id` FROM `".$_SESSION['prefix']."reward` WHERE ".
                         "`User_Id`='".$_GET["username"]."' AND `Pinned`=true LIMIT 1");
    if ($b = mysql_fetch_array($badge)) { $ret = $b[0]; }
    return $ret;
}

function getUnreadBadges()
{
    $ret = "";
    $badges = mysql_query("SELECT COUNT(*) AS n, A.Award_Group AS g, A.Award_type AS t FROM `".$_SESSION['prefix']."reward` R ".
         "INNER JOIN `".$_SESSION['prefix']."award` A WHERE ".
         "R.User_Id='".$_GET["username"]."' AND R.Unread=true AND R.Award_Id=A.Award_Id GROUP BY A.Award_Group");

    while ($b=mysql_fetch_array($badges)) {
        if (strlen($ret)) { $ret .=","; }
        $ret .= '{"count":'.$b[0].',"group":"'.$b[1].'","type":"'.$b[2].'"}';
    }
    if (strlen($ret)) { $ret="[".$ret."]"; }

    return $ret;
}

function getNbNewBadges()
{
    $ret = 0;
    $badges = mysql_query("SELECT COUNT(*) FROM `".$_SESSION['prefix']."reward` WHERE ".
         "User_Id='".$_GET["username"]."' AND New=true");
    if ($b=mysql_fetch_array($badges)) { $ret = $b[0]; }
    return $ret;
}

function updateBadges($_nbStars,$_nbNodes)
{
    $ret    = false;
    $values = "";

    $awards = mysql_query("SELECT `Award_Id`, `Award_Description` FROM `".$_SESSION['prefix']."award`");
    while ($b=mysql_fetch_array($awards)) {
        $good = true;
        $args = explode("|",$b["Award_Description"]);
        foreach($args as $arg) {
            $data = explode(":",$arg);
            if (!strcmp($data[0],"nbstars")) { if ($_nbStars<$data[1]) { $good = false; } }             else
            if (!strcmp($data[0],"nbnodes")) { if ($_nbNodes<$data[1]) { $good = false; } }
            else $good = false;
        }

        if ($good) {
            if (strlen($values)) { $values.=","; }
            $values.="('".$_GET["username"]."','".$b["Award_Id"]."')";
        }
    }

    if ($values) {
        mysql_query("INSERT INTO `".$_SESSION['prefix']."reward` (`User_Id`, `Award_Id`) VALUES ".$values.
                    " ON DUPLICATE KEY UPDATE `New`=false");
    }
    return $ret;
}


$stats          = 0;
$pinned         = "";
$nbnew          = 0;
$unreadbadges   = "";

if (!$error) {

    if ($_GET["action"]=="upd") {
        $stats = getUserStats();
        updateBadges($stats[0],$stats[1]);

        $pinned = getPinnedBadge();
        $unreadbadges=getUnreadBadges();
        $nbnew = getNbNewBadges();
    }
    else
    if ($_GET["action"]=="pin") {
        $value = $_GET["value"];
        if ($value) {
            mysql_query("UPDATE `".$_SESSION['prefix']."reward` SET `Pinned`=false WHERE User_Id='".$_GET["username"]."'");
            mysql_query("UPDATE `".$_SESSION['prefix']."reward` SET `Pinned`=true ".
                        "WHERE `Award_Id`='".$_GET["value"]."' AND User_Id='".$_GET["username"]."'");
        }
        $pinned=getPinnedBadge();
    }
    else
    if ($_GET["action"]=="read") {
        $value = $_GET["value"];
        if ($value) {
            mysql_query("UPDATE `".$_SESSION['prefix']."reward` SET `Unread`=false ".
                            "WHERE `Award_Id` IN (".str_replace("\'", "'", $value).") AND User_Id='".$_GET["username"]."'");
        }
        $unreadbadges=getUnreadBadges();
    }
    else
    if ($_GET["action"]=="look") {
        $awards = mysql_query("SELECT * FROM `".$_SESSION['prefix']."award` ".
                    "WHERE `Award_Group`='".$_GET["value"]."' ORDER BY `Award_Counter` ASC");
        while ($a = mysql_fetch_array($awards)) {
            $state = 0;
            $pinned = false;
            $reward = mysql_query("SELECT Unread, Pinned FROM `".$_SESSION['prefix']."reward` WHERE ".
                "User_Id='".$_GET["username"]."' AND Award_Id='".$a["Award_Id"]."'");
            if ($r = mysql_fetch_array($reward)) { $state = $r[0]?2:1; $pinned = $r[1]; }

            if (strlen($json)) { $json.=","; }
            $json.='{"id":"'.$a["Award_Id"].'","title":"'.$a["Award_Title"].'","type":"'.$a["Award_Type"].'",'.
                   '"label":"'.$a["Award_Label"].'","state":'.$state.',"pinned":"'.$pinned.'"}';
        }
    }
    else
    {
        $types = mysql_query("SELECT `Award_Group`, `Award_Type` FROM `".$_SESSION['prefix']."award` GROUP BY `Award_Group` ".
                             "ORDER BY `Award_Counter` ASC");
        $json = "";
        while($t = mysql_fetch_array($types)) {
            if (strlen($json)) { $json.=","; }
            $json.='{"type":"'.$t["Award_Type"].'","label":"'.$t["Award_Group"].'"}';
        }
    }

    $status = "success";

}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
if ($json)          { echo ', "awards":['.$json.']'; }
if ($stats)         { echo ',  "stars" : "'.$stats[0].'"'; }
if ($nbnew)         { echo ',  "nbnew" : '.$nbnew; }
if ($unreadbadges)  { echo ',  "unreadbadges" : '.$unreadbadges; }
if ($pinned)        { echo ',  "pin" : "'.$pinned.'"'; }
echo '}';


?>
