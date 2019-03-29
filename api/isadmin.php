<?php

$rc = session_start();


// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (array_key_exists("admin",$_SESSION) && $_SESSION["admin"]==true ) 	{ echo '  "status" : "success"'; }
else																	{ echo '  "status" : "error"'; }
echo ', "version" : "'.phpversion().'"';
echo ', "session" : "'.$rc.'"';
echo ', "from" : "jlodb/api" }';

?>

