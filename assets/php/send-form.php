<?php
// deploy-debug: forcing a re-upload to diagnose missing assets/php on server
header('Content-Type: application/json');

$TO        = 'info@b-uniform.com';
$SMTP_HOST = 'smtp.hostinger.com';
$SMTP_PORT = 465;                    // SSL
$SMTP_USER = 'info@b-uniform.com';

// SMTP password is kept OUT of the repo. Create assets/php/config.php on the
// server (see config.sample.php) returning ['smtp_password' => '...'].
$config    = @include __DIR__ . '/config.php';
$SMTP_PASS = is_array($config) ? ($config['smtp_password'] ?? '') : '';

// Honeypot: real visitors never fill this hidden field, bots often do.
if (!empty($_POST['website'] ?? '')) {
    echo json_encode(['success' => true]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

function clean_header_value($value) {
    return trim(str_replace(["\r", "\n"], '', $value));
}

$formType = clean_header_value($_POST['form_type'] ?? 'contact');
$name     = clean_header_value($_POST['name'] ?? '');
$email    = clean_header_value($_POST['email'] ?? '');

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'A valid email address is required.']);
    exit;
}

$lines = [];

switch ($formType) {
    case 'wholesale':
        $subject = 'New Wholesale Quote Request - B-Uniform';
        $lines[] = 'Full Name: ' . $name;
        $lines[] = 'Business / School: ' . trim($_POST['business'] ?? '');
        $lines[] = 'Email: ' . $email;
        $lines[] = 'Phone: ' . trim($_POST['phone'] ?? '');
        $lines[] = 'Products of Interest: ' . trim($_POST['products'] ?? '');
        $lines[] = 'Estimated Quantity: ' . trim($_POST['quantity'] ?? '');
        $lines[] = '';
        $lines[] = 'Additional Details:';
        $lines[] = trim($_POST['message'] ?? '');
        break;

    case 'newsletter':
        $subject = 'New Newsletter Subscriber - B-Uniform';
        $lines[] = 'Email: ' . $email;
        break;

    default: // contact
        $subject = 'New Contact Form Message - B-Uniform';
        $lines[] = 'Full Name: ' . $name;
        $lines[] = 'Email: ' . $email;
        $lines[] = 'Subject: ' . trim($_POST['subject'] ?? '(none)');
        $lines[] = '';
        $lines[] = 'Message:';
        $lines[] = trim($_POST['message'] ?? '');
        break;
}

$body    = implode("\n", $lines);
$replyTo = $name !== '' ? "$name <$email>" : $email;

$err = '';
if ($SMTP_PASS !== '') {
    $ok = smtp_send($SMTP_HOST, $SMTP_PORT, $SMTP_USER, $SMTP_PASS, $TO, 'B-Uniform Website', $SMTP_USER, $replyTo, $subject, $body, $err);
    if (!$ok) {
        error_log('B-Uniform form SMTP failed: ' . $err);
    }
} else {
    // No SMTP configured yet — fall back to PHP mail() so nothing hard-breaks.
    $headers = "From: B-Uniform Website <$SMTP_USER>\r\nReply-To: $replyTo\r\nContent-Type: text/plain; charset=UTF-8";
    $ok = mail($TO, $subject, $body, $headers, '-f ' . $SMTP_USER);
    if (!$ok) {
        error_log('B-Uniform form mail() failed (no SMTP config present)');
    }
}

if ($ok) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'The message could not be sent.']);
}

/* ---------------- Minimal dependency-free SMTP client ---------------- */

function smtp_expect($fp, $expect, &$err) {
    $resp = '';
    while (($line = fgets($fp, 515)) !== false) {
        $resp .= $line;
        // A space in the 4th position marks the final line of the reply.
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }
    $code = (int) substr($resp, 0, 3);
    if ($code !== $expect) {
        $err = "SMTP expected $expect, got: " . trim($resp);
        return false;
    }
    return true;
}

function smtp_send($host, $port, $user, $pass, $to, $fromName, $fromEmail, $replyTo, $subject, $body, &$err) {
    $err = '';
    $remote = ($port == 465 ? 'ssl://' : '') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, 30);
    if (!$fp) {
        $err = "connect failed: $errstr ($errno)";
        return false;
    }
    stream_set_timeout($fp, 30);

    if (!smtp_expect($fp, 220, $err)) { fclose($fp); return false; }

    fwrite($fp, "EHLO b-uniform.com\r\n");
    if (!smtp_expect($fp, 250, $err)) { fclose($fp); return false; }

    fwrite($fp, "AUTH LOGIN\r\n");
    if (!smtp_expect($fp, 334, $err)) { fclose($fp); return false; }
    fwrite($fp, base64_encode($user) . "\r\n");
    if (!smtp_expect($fp, 334, $err)) { fclose($fp); return false; }
    fwrite($fp, base64_encode($pass) . "\r\n");
    if (!smtp_expect($fp, 235, $err)) { fclose($fp); return false; }

    fwrite($fp, "MAIL FROM:<$fromEmail>\r\n");
    if (!smtp_expect($fp, 250, $err)) { fclose($fp); return false; }
    fwrite($fp, "RCPT TO:<$to>\r\n");
    if (!smtp_expect($fp, 250, $err)) { fclose($fp); return false; }
    fwrite($fp, "DATA\r\n");
    if (!smtp_expect($fp, 354, $err)) { fclose($fp); return false; }

    // Normalize to CRLF and dot-stuff lines that begin with a period.
    $body = preg_replace('~\r\n?|\n~', "\r\n", $body);
    $body = preg_replace('/^\./m', '..', $body);

    $headers  = "From: $fromName <$fromEmail>\r\n";
    $headers .= "To: <$to>\r\n";
    $headers .= "Reply-To: $replyTo\r\n";
    $headers .= 'Date: ' . date('r') . "\r\n";
    $headers .= "Subject: $subject\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";

    fwrite($fp, $headers . "\r\n" . $body . "\r\n.\r\n");
    if (!smtp_expect($fp, 250, $err)) { fclose($fp); return false; }

    fwrite($fp, "QUIT\r\n");
    fclose($fp);
    return true;
}
