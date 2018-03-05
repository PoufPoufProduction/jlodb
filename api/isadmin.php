<?php

session_start();

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (array_key_exists("admin",$_SESSION) && $_SESSION["admin"]==1 ) 	{ echo '  "status" : "success",'; }
else                    											{ echo '  "status" : "error",'; }
echo '  "from" : "jlodb/api" }';

?>

