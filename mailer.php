<?php

    // Only process POST requests.
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        // Get the form fields and remove whitespace.
        $name = strip_tags(trim($_POST["first_name"]));
        $name = str_replace(array("\r","\n"),array(" "," "),$name);

         $last_name = strip_tags(trim($_POST["last_name"]));
        $last_name = str_replace(array("\r","\n"),array(" "," "),$last_name);

        $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
        $story = trim($_POST["story"]);
        $location = trim($_POST["location"]);
        $image_url = trim($_POST["image_url"]);

        // Check that data was sent to the mailer.
        if ( empty($name) OR empty($story) OR !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // Set a 400 (bad request) response code and exit.
            http_response_code(400);
            echo "Oops! There was a problem with your submission. Please complete the form and try again.";
            exit;
        }

        // Set the recipient email address.
        // FIXME: Update this to your desired email address.
        $recipient = "lo@youthradio.org";

        // Set the email subject.
        $subject = "West Side Stories: new contact from $name";

        // Build the email content.
        $email_content = "Name/Nickname: $name\n";
        $email_content .= "Last Name: $last_name\n";
        $email_content .= "Email: $email\n\n";
        $email_content .= "Story:\n$story\n";
        $email_content .= "Location:\n$location\n";
        $email_content .= "Image Url:\n$image_url\n";

        // Build the email headers.
        $email_headers = "From: $name <$email>";

        // Send the email.
        if (mail($recipient, $subject, $email_content, $email_headers)) {
            // Set a 200 (okay) response code.
            http_response_code(200);
            echo "Thank You! Your message has been sent.";
        } else {
            // Set a 500 (internal server error) response code.
            http_response_code(500);
            echo "Oops! Something went wrong and we couldn't send your message.";
        }

    } else {
        // Not a POST request, set a 403 (forbidden) response code.
        http_response_code(403);
        echo "There was a problem with your submission, please try again.";
    }

?>