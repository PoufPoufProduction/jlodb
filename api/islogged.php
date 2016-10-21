<?php

session_start();

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if (array_key_exists("admin",$_SESSION)) 	{ echo '  "status" : "success"'; }
else                    					{ echo '  "status" : "error"'; }
echo '}';

?>

