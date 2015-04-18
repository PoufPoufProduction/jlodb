<?php
$forceReadFile = 1;
$apipath = "../../../api/";
include $apipath."database.php";

if (!$error) {
    $config             = '  "settings":{"host":"'.$_SESSION['host'].'", "database":"'.$_SESSION['database'].'", '.
                          '"username":"'.$_SESSION['username'].'"},';

    // CHECK IF THE CALLER IS LOGGED AS ADMIN
    if (!$_SESSION['admin']) {
        $textstatus = "operation is not authorized";
        $error = 100;
    }
    else {
        // BUILD THE NODE TABLE FROM XML STATIC FILES
        // LINKS BETWEEN NODES ARE DEFINED DIRECTLY IN THE SVG MAP THANKS TO THE .link CLASS
        mysql_query('DROP TABLE '.$_SESSION['prefix'].'node');

        if (mysql_query('CREATE TABLE `'.$_SESSION['prefix'].'node` (`Node_Id` INT NOT NULL, '.
                       '`Node_Title` char(255) NOT NULL, `Node_Description` TEXT NOT NULL, `Node_Subject` TEXT NOT NULL, '.
                       '`Node_Level` INT, `Node_Exercices` TEXT NOT NULL, '.
                       'PRIMARY KEY (`Node_Id`)) ENGINE=InnoDB', $link)  ) {

            $error = 0;
            $status= "success";

            // FILL THE NODE TABLE THANKS TO THE NODES.RDF FILE
            if ($handle = opendir("../data/nodes/")) {
                while (false !== ($nodesfile = readdir($handle))) {
                    if ($nodesfile != "." && $nodesfile != "..") {
                        // READ THE RDF FILE
                        $rdf = file_get_contents("../data/nodes/".$nodesfile);
                        $rdf = str_replace('rdf:','rdf_', $rdf);
                        $rdf = str_replace('dct:','dct_', $rdf);
                        $rdf = str_replace('xml:','xml_', $rdf);
                        $xml = new SimpleXMLElement($rdf);

                        // PARSE THE ACTIVITIES RDF FILE FOR FILLING THE ACTIVITY TABLE
                        foreach ($xml->children() as $childName=>$child) {
                            $nodeId             = 0;
                            $nodeTitle          = "";
                            $nodeDescription    = "";
                            $nodeExercices      = "";
                            $nodeSubject        = "";
                            $nodeLevel          = 0;
                            $levelId            = 0;
                            if (strcmp($childName,"rdf_Description")==0) {
                                foreach ($child->children() as $dcName=>$dc) {
                                    if (strcmp($dcName,"dct_identifier")==0)         { $nodeId=$dc; }           else
                                    if (strcmp($dcName,"dct_description")==0)        { $nodeExercices=$dc; }    else
                                    if (strcmp($dcName,"dct_educationLevel")==0)     { $nodeLevel=$dc; }        else
                                    if (strcmp($dc->attributes()->xml_lang, $_SESSION['lang'])==0) {
                                        if (strcmp($dcName,"dct_title")==0)         { $nodeTitle=$dc; }         else
                                        if (strcmp($dcName,"dct_abstract")==0)      { $nodeDescription=$dc; }else
                                        if (strcmp($dcName,"dct_subject")==0)       { $nodeSubject=$dc; }
                                    }
                                }

                                $nodeDescription = str_replace("'", "\'", $nodeDescription);
                                $nodeTitle = str_replace("'", "\'", $nodeTitle);
                                $nodeSubject = str_replace("'", "\'", $nodeSubject);

                                $sql = "INSERT INTO `".$_SESSION['prefix']."node` (`Node_Id`, `Node_Title`, `Node_Description`, ".
                                    "`Node_Subject`, `Node_Exercices`, `Node_Level` ) VALUES (".
                                    $nodeId.",'".$nodeTitle."','".$nodeDescription."','".$nodeSubject."','".$nodeExercices."','".
                                    $nodeLevel."')";
                                mysql_query($sql , $link);

                            }
                        }
                    }
                }
            }
        }
    }
}

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
echo $config;
echo '  "status" : "'.$status.'",';
if ($error) { echo '  "error" : '.$error.','; }
echo '  "textStatus" : "'.$textstatus.'"';
echo '}';


?>
