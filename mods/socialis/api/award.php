<?php
$apipath = "../../../api/";
include_once $apipath."database.php";
include_once $apipath."mods/check.php";


function getPinnedBadge()
{
    $ret = "";
    $badge = mysql_query("SELECT `Award_Id` FROM `".$_SESSION['prefix']."reward` WHERE ".
                         "`User_Key`='".$_SESSION['User_Key']."' AND `Pinned`=true LIMIT 1");
    if ($b = mysql_fetch_array($badge)) { $ret = $b[0]; }
    return $ret;
}

function getUnreadBadges()
{
    $ret = "";
    $badges = mysql_query("SELECT COUNT(*) AS n, A.Award_Group AS g, A.Award_type AS t FROM `".$_SESSION['prefix']."reward` R ".
         "INNER JOIN `".$_SESSION['prefix']."award` A WHERE ".
         "R.User_Key='".$_SESSION['User_Key']."' AND R.Unread=true AND R.Award_Id=A.Award_Id GROUP BY A.Award_Group");

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
         "User_Key='".$_SESSION['User_Key']."' AND New=true");
    if ($b=mysql_fetch_array($badges)) { $ret = $b[0]; }
    return $ret;
}

function updateBadges($_node)
{
    $values = "";
    $nodes = "";

    if ($_node=="1") {
        $genius = mysql_query("SELECT * FROM `".$_SESSION['prefix']."genius` WHERE `User_Key`='".$_SESSION['User_Key']."'");
        $g = mysql_fetch_array($genius);
        $nodes = $g["Genius"];
    }

    $nbstars = 0;
    $nbnodes = 0;
    if ($_node=="0") {
        $stars = mysql_query("SELECT * FROM `".$_SESSION['prefix']."state` WHERE `User_Key`='".$_SESSION['User_Key']."'");
        while($s = mysql_fetch_array($stars)) {
            $nbstars += 3*substr_count($s["State"],"5") + 2*substr_count($s["State"],"4") + 1*substr_count($s["State"],"3");
            $last = substr($s["State"], -1);
            if ($last=='2'||$last=='3'||$last=='4'||$last=='5') { $nbnodes++; }
        }
        mysql_query("UPDATE `".$_SESSION['prefix']."user` SET `User_Stars`=".$nbstars." WHERE `User_Key` = '".$_SESSION['User_Key']."'");
    }

    $user = mysql_query("SELECT * FROM `".$_SESSION['prefix']."user` WHERE `User_Key`='".$_SESSION['User_Key']."'");
    $u = mysql_fetch_array($user);

    $awards = mysql_query("SELECT `Award_Id`, `Award_Description` FROM `".$_SESSION['prefix']."award`");
    while ($b=mysql_fetch_array($awards)) {
        $good = true;
        $args = explode("|",$b["Award_Description"]);
        foreach($args as $arg) {
            $data = explode(":",$arg);
            if (!strcmp($data[0],"nbstars")) { if ($nbstars<$data[1]) { $good = false; } }             else
            if (!strcmp($data[0],"nbnodes")) { if ($nbnodes<$data[1]) { $good = false; } }             else
            if (!strcmp($data[0],"nbdays"))  { if ($u["User_Days"]<$data[1]) { $good = false; } }       else
            if (!strcmp($data[0],"node") && $_node=="1")   {
                $good = false;
                $byte     = floor($data[1]/3);
                $offset   = (1<<(5-($data[1]%3)*2)) | (1<<(4-($data[1]%3)*2));
                if ($byte<strlen($nodes)) {
                    // AS IN jquery.jlodb.genius.js
                    $r = 63;
                    $val = ord($nodes[$byte]);
                    if ($val>=65 && $val<=90)   { $r = $val - 65; } else
                    if ($val>=97 && $val<=122)  { $r = $val - 97 + 26; } else
                    if ($val>=48 && $val<=57)   { $r = $val - 48 + 52; } else
                    if ($val==43) { $r = 62; }

                    $r = ($r & $offset)>>(4-($data[1]%3)*2);
                    if ($r & 2) { $good = true; }
                }
            } else $good = false;
        }

        if ($good) {
            if (strlen($values)) { $values.=","; }
            $values.="('".$_SESSION['User_Key']."','".$b["Award_Id"]."')";
        }
    }

    if ($values) {
        mysql_query("INSERT INTO `".$_SESSION['prefix']."reward` (`User_Key`, `Award_Id`) VALUES ".$values.
                    " ON DUPLICATE KEY UPDATE `New`=false");
    }
    return $nbstars;
}


$stats          = 0;
$pinned         = "";
$nbnew          = 0;
$unreadbadges   = "";
$nstars         = 0;

if (!$error) {

    if ($_GET["action"]=="upd") {
        $nstars = updateBadges($_GET["node"]);

        $pinned = getPinnedBadge();
        $unreadbadges=getUnreadBadges();
        $nbnew = getNbNewBadges();
    }
    else
    if ($_GET["action"]=="pin") {
        $value = $_GET["value"];
        if ($value) {
            mysql_query("UPDATE `".$_SESSION['prefix']."reward` SET `Pinned`=false WHERE `User_Key`='".$_SESSION['User_Key']."'");
            mysql_query("UPDATE `".$_SESSION['prefix']."reward` SET `Pinned`=true ".
                        "WHERE `Award_Id`='".$_GET["value"]."' AND `User_Key`='".$_SESSION['User_Key']."'");
        }
        $pinned=getPinnedBadge();
    }
    else
    if ($_GET["action"]=="read") {
        $value = $_GET["value"];
        if ($value) {
            mysql_query("UPDATE `".$_SESSION['prefix']."reward` SET `Unread`=false ".
                            "WHERE `Award_Id` IN (".str_replace("\'", "'", $value).") AND `User_Key`='".$_SESSION['User_Key']."'");
        }
        $unreadbadges=getUnreadBadges();
    }
    else
    if ($_GET["action"]=="look") {
        $awards = mysql_query("SELECT * FROM `".$_SESSION['prefix']."award` ".
                    "WHERE `Award_Group`=\"".$_GET["value"]."\" ORDER BY `Award_Counter` ASC");
        while ($a = mysql_fetch_array($awards)) {
            $state = 0;
            $pinned = false;
            $reward = mysql_query("SELECT Unread, Pinned FROM `".$_SESSION['prefix']."reward` WHERE ".
                "`User_Key`='".$_SESSION['User_Key']."' AND Award_Id='".$a["Award_Id"]."'");
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
if ($nstars)        { echo ',  "stars" : "'.$nstars.'"'; }
if ($nbnew)         { echo ',  "nbnew" : '.$nbnew; }
if ($unreadbadges)  { echo ',  "unreadbadges" : '.$unreadbadges; }
if ($pinned)        { echo ',  "pin" : "'.$pinned.'"'; }
echo '}';


?>
