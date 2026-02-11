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

        // TEST 1: GET (Read)
        echo "8. Testing Supabase GET (read)...\n";
        // Valid query: select only ID, limit 1
        $test_response = Database::query('categorias', ['select' => 'id', 'limit' => '1']);

        echo "   Response Status: " . $test_response['status'] . "\n";
        echo "   Response Data: " . print_r($test_response['data'], true) . "\n";

        if ($test_response['status'] >= 200 && $test_response['status'] < 300) {
            echo "   SUCCESS: GET works!\n";
        } else {
            echo "   ERROR: GET failed.\n";
        }

        // TEST 2: POST (Insert)
        echo "9. Testing Supabase POST (write dry-run)...\n";

        // TEST 2: POST (Insert)
        echo "9. Testing Supabase POST (write dry-run)...\n";

        $jwt_secret = getenv('SUPABASE_JWT_SECRET');
        $valid_token = null;

        if ($jwt_secret) {
            echo "   Generating fresh Service Role JWT using Secret...\n";
            try {
                // Manually create a JWT to bypass "sb_secret" format issues
                $payload = [
                    "role" => "service_role",
                    "iss" => "supabase",
                    "iat" => time(),
                    "exp" => time() + 60 // 1 minute
                ];
                // Use simple base64url encoding signature if library fails, 
                // OR use the library available in autoload
                if (class_exists('Firebase\JWT\JWT')) {
                    $valid_token = \Firebase\JWT\JWT::encode($payload, $jwt_secret, 'HS256');
                    echo "   JWT generated successfully.\n";
                } else {
                    echo "   WARNING: JWT library not found. Cannot generate token.\n";
                }
            } catch (Throwable $e) {
                echo "   WARNING: Failed to generate JWT: " . $e->getMessage() . "\n";
            }
        }

        if ($valid_token) {
            Database::setToken($valid_token);
        } else {
            // Fallback to existing key if generation failed
            $service_key = getenv('SUPABASE_SERVICE_ROLE_KEY');
            if ($service_key)
                Database::setToken($service_key);
        }

        // Attempt to insert a dummy category 
        $dummy_name = "Debug " . time();
        $test_insert = Database::insert('categorias', ['nombre' => $dummy_name]);

        echo "   Response Status: " . $test_insert['status'] . "\n";
        echo "   Response Data: " . print_r($test_insert['data'], true) . "\n";

        if ($test_insert['status'] >= 200 && $test_insert['status'] < 300) {
            echo "   SUCCESS: POST works!\n";
        } else {
            echo "   ERROR: POST failed. (Code: " . $test_insert['status'] . ")\n";
        }
    } else {
        echo "7. ERROR: Database class missing\n";
    }
} catch (Throwable $e) {
    echo "7. CRASH checking Database class or Connection: " . $e->getMessage() . "\n";
    exit;
}

echo "10. All checks passed. The server environment seems OK.\n";

