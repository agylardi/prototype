<?php

/*

This file is used as an example but should be modified to include your e-mail below along with any other additional fields & security for user inputs. 
Programming experience is recommended for modifications.

*/

// define variables and set to empty values
$name = $email = $special_request = $hiddentotal = $hiddendetails = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $name = validate_input($_POST["name"]);
  $email = validate_input($_POST["email"]);
  $special_request = validate_input($_POST["special_request"]);
  $hiddentotal = validate_input($_POST["hidden_total"]);
  $hiddendetails = validate_input($_POST["hidden_details"]);
 }

function validate_input($data) {
  $data = trim($data);
  $data = stripslashes($data);  
  return $data;
}

$emailto="youremail@yourdomain.com";


//If e-mail inputted isn't valid, it will automatically come from this address
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {$email="webmaster@example.com";}

$headers  = 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
$headers .= "From: ".$email."" . "\r\n"; 

$subject="Price Quote";

$msg="<html><body>";
$msg.= "Name: " . $name . "<br />";
$msg.="E-mail: " . $email . "<br />";
$msg.="Special Request: " . $special_request . "<br />";
$msg.="Total: " . $hiddentotal . "<br />";
$msg.= $hiddendetails;
$msg.="</html></body>";


mail($emailto,$subject,$msg,$headers);


?>