<?php

session_start();

// PUBLISH DATA UNDER JSON FORMAT
echo '{';
if ($_SESSION['admin']) { echo '  "status" : "success"'; }
else                    { echo '  "status" : "error"'; }
echo '}';

?>

