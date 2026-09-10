<?php
// Copy this file to config.php on the SERVER (same folder) and fill in the
// real secrets. Do NOT commit config.php to git — it's gitignored.
//
// config.php must return an array exactly like this:
return [
    'smtp_password'   => 'PASTE_THE_INFO@B-UNIFORM.COM_MAILBOX_PASSWORD_HERE',
    // Sender.net API key + Group ID, used to add newsletter signups to a
    // mailing list. Leave blank to skip Sender.net sync (email notification
    // still works either way).
    'sender_api_key'  => '',
    'sender_group_id' => '',
];
