<?php
// backend/debug_full.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: text/plain");

echo "1. Script started\n";

// Check files
$cwd = getcwd();
echo "2. CWD: $cwd\n";

$autoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($autoload)) {
    echo "3. Autoload found at $autoload\n";
} else {
    echo "3. ERROR: Autoload NOT found at $autoload\n";
    exit;
}

// Try loading autoload
try {
    require_once $autoload;
    echo "4. Autoload loaded successfully\n";
} catch (Throwable $e) {
    echo "4. CRASH loading autoload: " . $e->getMessage() . "\n";
    exit;
}

// Try checking env vars
echo "5. Checking basic env vars...\n";
$test_env = getenv('SUPABASE_URL');
echo "   SUPABASE_URL from getenv: " . ($test_env ? "FOUND" : "MISSING") . "\n";

// Try loading config
try {
    if (file_exists(__DIR__ . '/config/config.php')) {
        require_once __DIR__ . '/config/config.php';
        echo "6. Config loaded successfully\n";
    } else {
        echo "6. ERROR: config.php not found\n";
    }
} catch (Throwable $e) {
    echo "6. CRASH loading config: " . $e->getMessage() . "\n";
    // Print stack trace if possible
    echo $e->getTraceAsString();
    exit;
}

// Try Database init
try {
    if (class_exists('Database')) {
        echo "7. Database class exists\n";
    } else {
        echo "7. ERROR: Database class missing\n";
    }
} catch (Throwable $e) {
    echo "7. CRASH checking Database class: " . $e->getMessage() . "\n";
    exit;
}

echo "8. All checks passed. The server environment seems OK.\n";
echo "If index.php fails, it might be the routing logic or specific controller.\n";
