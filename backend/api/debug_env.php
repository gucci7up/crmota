<?php
header("Content-Type: application/json");

$vars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET'
];

$results = [];
foreach ($vars as $key) {
    $results[$key] = [
        'getenv' => getenv($key) ? 'SET (Length: ' . strlen(getenv($key)) . ')' : 'NOT SET',
        '$_ENV' => isset($_ENV[$key]) ? 'SET' : 'NOT SET',
        '$_SERVER' => isset($_SERVER[$key]) ? 'SET' : 'NOT SET'
    ];
}

echo json_encode([
    "status" => "debug",
    "php_sapi" => php_sapi_name(),
    "variables" => $results
]);
