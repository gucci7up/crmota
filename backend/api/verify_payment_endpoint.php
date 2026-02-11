<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Check if process_payment.php exists in same directory
if (file_exists(__DIR__ . '/process_payment.php')) {
    echo json_encode([
        "status" => "ok",
        "message" => "Payment endpoint exists and is reachable",
        "path" => __DIR__ . '/process_payment.php',
        "url" => $_SERVER['REQUEST_URI']
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "error" => "Payment endpoint file missing",
        "scanned_path" => __DIR__
    ]);
}
