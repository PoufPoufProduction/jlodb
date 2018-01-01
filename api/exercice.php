<?php
include "database.php";

// EXERCICES.PHP
// @return A LIST OF EXERCICES (USE EXERCICE.PHP TO GET THE PARAMETER OF ONE EXERCICE)

if (!$error) {

    // THE CONDITIONS
    $where="";
    if (array_key_exists("activity",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }

        $activity = "";
        $tok = strtok($_GET["activity"], ",");
        while($tok!=false) {
            if (strlen($tok)) {
                if (strlen($activity)!=0) { $activity.=","; }
                if ($tok[0]!='\'') { $activity.="'".$tok."'"; } else { $activity.=$tok; }
            }
            $tok = strtok(",");
        }
        $where.= " `Exercice_Activity` IN ( ".str_replace("\'", "'", $activity)." )";
    }

    // THE LEVEL
    if (array_key_exists("levelmin",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Level` >= ".$_GET["levelmin"]." ";
    }
    if (array_key_exists("levelmax",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Level` <= ".$_GET["levelmax"]." ";
    }

    // THE DIFFICULTY
    if (array_key_exists("diffmin",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Difficulty` >= ".$_GET["diffmin"]." ";
    }
    if (array_key_exists("diffmax",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Difficulty` <= ".$_GET["diffmax"]." ";
    }

    // THE DURATION
    if (array_key_exists("extendmin",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Duration` >= ".$_GET["extendmin"]." ";
    }
    if (array_key_exists("extendmax",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Duration` <= ".$_GET["extendmax"]." ";
    }

    // THE CLASSIFICATION
    if (array_key_exists("classification",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        $classification = "";
        $tok = strtok($_GET["classification"], ",");
        while($tok!=false) {
            if (strlen($tok)) {
                if (strlen($classification)!=0) { $classification.=","; }
                if ($tok[0]!='\'') { $classification.="'".$tok."'"; } else { $classification.=$tok; }
            }
            $tok = strtok(",");
        }

        $where.= " `Exercice_Classification` IN ( ".str_replace("\'", "'", $classification)." )";
    }

    // THE TAGS
    if (array_key_exists("tag",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Tags` LIKE '%{$_GET["tag"]}%'";
    }

    // THE REFERENCE
    if (array_key_exists("reference",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        $where.= " `Exercice_Reference` = '".$_GET["reference"]."'";
    }

    // THE ID
    if (array_key_exists("id",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        
        if (strpos($_GET["id"],",")) {
            
            $ids = "";
            $tok = strtok($_GET["id"], ",");
            while($tok!=false) {
                if (strlen($ids)!=0)   { $ids.=","; }
                if (!strpos($tok,"'")) { $ids.="'".$tok."'"; } else { $ids.=$tok; }
                $tok = strtok(",");
            }

            $where.= " `Exercice_Id` IN ( ".$ids." )";
        }
        else {
            if (array_key_exists("detail",$_GET) || array_key_exists("novariant",$_GET)) {
                $where.=" `Exercice_Id`='".$_GET["id"]."'";
            }
            else { $where.=" (`Exercice_Id`='".$_GET["id"]."' OR `Exercice_Variant`='".$_GET["id"]."')"; }
        }
    }

    // COUNT THE NUMBER OF MATCHING EXERCICES (WITHOU ORDER, LIMIT NOR ALTERNATIVE GROUP)
    $sql = "SELECT COUNT(*) FROM `".$_SESSION['prefix']."exercice`";
    if (strlen($where)) { $sql.=" WHERE".$where; }    
	$ret 	= mysqli_query($link, $sql);
	$count 	= 0;
    if ($ret) { $count = mysqli_fetch_array($ret); }

    // THE VARIANT
    if (!array_key_exists("id",$_GET) && !array_key_exists("alt",$_GET) && !array_key_exists("detail",$_GET)) {
        if (strlen($where)) { $where.=" AND"; }
        $where.=" `Exercice_Variant`=''";
    }

    // THE ORDER
    $order = " ORDER BY Exercice_Id ASC";
    if ( array_key_exists("order",$_GET)) {
        if ($_GET["order"]=="rand") { $order=" ORDER BY RAND( )"; }
        else if (array_key_exists("by",$_GET)) {
            $order=" ORDER BY Exercice_".$_GET["by"]." ".$_GET["order"];
            if ($_GET["by"]!="Id") { $order.=",Exercice_Id ASC"; }
        }
    }

    // BUILD THE REQUEST
    $sql = "SELECT * FROM `".$_SESSION['prefix']."exercice`, `".$_SESSION['prefix']."activity` WHERE ".
                            " `Exercice_Activity` = `Activity_Name`";
    if (strlen($where)) { $sql.=" AND".$where; }


    $limit = "500";
    if (array_key_exists("limit",$_GET)) { $limit = $_GET["limit"]; }
    $sql.= $order." LIMIT ".$limit;

    if (array_key_exists("raw",$_GET)) {
        $sql = "SELECT * FROM `".$_SESSION['prefix']."exercice`";
    }

    $exercice = mysqli_query($link, $sql);
    $json = "";
	if ($exercice) {
		while($row = mysqli_fetch_array($exercice)) {
			if (strlen($json)) { $json.=array_key_exists("raw",$_GET)?"\n":","; }
			$json.='{';
            $json.='"id":"'.$row["Exercice_Id"].'",';
            $json.='"label":"'.$row["Exercice_Title"].'",';
            $json.='"activity":"'.$row["Exercice_Activity"].'",';
            $json.='"classification":"'.$row["Exercice_Classification"].'",';
            $json.='"level":'.$row["Exercice_Level"].',';
            $json.='"diff":'.$row["Exercice_Difficulty"].',';
            $json.='"extend":'.$row["Exercice_Duration"].',';
            $json.='"variant":"'.$row["Exercice_Variant"].'",';
            $json.='"base":"'.$row["Exercice_Base"].'",';
            $json.='"tag":"'.$row["Exercice_Tags"].'",';
            $json.='"reference":"'.$row["Exercice_Reference"].'",';
            
            if (array_key_exists("detail",$_GET)) {
                
                if ($row["Exercice_Base"]) {
					$base = mysqli_query($link, "SELECT Exercice_Parameters FROM `".$_SESSION['prefix']."exercice` ".
												"WHERE `Exercice_Id`='".$row["Exercice_Base"]."'");
					if ($rowbase = mysqli_fetch_array($base)) {
						$json.='"data":{'.$rowbase["Exercice_Parameters"].',"dataex":{'.$row["Exercice_Parameters"].'}},';
					}
				}
				else { $json.='"data":{'.$row["Exercice_Parameters"].'},'; }
				
				
                $json.='"ext":"'.$row["Activity_External"].'",';
                if (!array_key_exists("nolocale",$_GET)) {
                    $json.='"locale":{"label":"'.$row["Activity_Title"].'",'.$row["Activity_Locale"].'},';
                }
            }
            
            if (array_key_exists("source",$_GET)) {
                $source = $row["Activity_Source"];
                if (strlen($source) && strlen($row["Exercice_Source"])) { $source.=","; }
                $source.= $row["Exercice_Source"];
            
                $json.='"source":"'.$source.'",';
            }
            
            $json.='"nb":'.$row["Exercice_Nb"].'}';
		}
	}
    $status     = "success";
}

// PUBLISH DATA UNDER JSON FORMAT
if (array_key_exists("raw",$_GET)) { echo $json; }
else {
    echo '{';
    if (isset($status))                 { echo '  "status" : "'.$status.'",'; }
    if (isset($error) && $error)        { echo '  "error" : '.$error.','; }
    if (isset($textstatus))             { echo '  "textStatus" : "'.$textstatus.'",'; }
    if (isset($count))                  { echo '  "nb" : '.($count?$count[0]:0).','; }
    if (isset($json))                   { echo '  "exercices" : ['.$json.'],'; }
    echo '  "from" : "jlodb/api" }';
}
?>
