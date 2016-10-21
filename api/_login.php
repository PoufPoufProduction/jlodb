<?php

function login($username, $password, &$status, &$textstatus, &$error)
{
    $filename   = "../conf/jlodb.ini";
    $_SESSION['admin'] = false;

    
    // CHECK IF THE CONFIGURATION FILE IS HERE
    if (!file_exists($filename)) {
        $textstatus = "$filename: configuration file is missing";
        $error = 1;
    }
    else
    {
        // EXPORT THE CONFIGURATION FILE
        $ini_array = parse_ini_file($filename, true);
		
        // CHECK THE LOGIN PARAMETERS
        if ( strcmp($ini_array["admin"]["username"], $username) == 0 &&
             strcmp($ini_array["admin"]["password"], md5($password)) == 0 ) {
            $status = "success";
            $textstatus = "logged successfuly";
            $_SESSION['admin'] = true;
        }
        else {
            $error = 101;
            $textstatus = "wrong administration login";
        }
    }
}


?> 
