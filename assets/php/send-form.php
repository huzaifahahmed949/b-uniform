<?php
header('Content-Type: application/json');

$to = 'info@b-uniform.com';

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
$name = clean_header_value($_POST['name'] ?? '');
$email = clean_header_value($_POST['email'] ?? '');

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

$body = implode("\n", $lines);
$replyTo = $name !== '' ? "$name <$email>" : $email;

$headers = [
    'From: B-Uniform Website <info@b-uniform.com>',
    'Reply-To: ' . $replyTo,
    'Content-Type: text/plain; charset=UTF-8',
];

$sent = mail($to, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'The message could not be sent.']);
}
