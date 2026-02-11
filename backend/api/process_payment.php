<?php
// backend/process_payment.php

// 1. CORS & Headers (Manually handled since we bypass index.php)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Error Handling (Force JSON)
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

function jsonError($message, $code = 500, $details = null)
{
    http_response_code($code);
    echo json_encode(["error" => $message, "details" => $details]);
    exit;
}

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno))
        return false;
    jsonError("PHP Error", 500, ["message" => $errstr, "file" => basename($errfile), "line" => $errline]);
});

set_exception_handler(function ($e) {
    jsonError("Uncaught Exception", 500, ["message" => $e->getMessage(), "file" => basename($e->getFile()), "line" => $e->getLine()]);
});

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_CORE_ERROR)) {
        if (ob_get_length())
            ob_clean();
        jsonError("Fatal Error", 500, ["message" => $error['message'], "file" => basename($error['file']), "line" => $error['line']]);
    }
});

// 3. Dependencies
if (!file_exists(__DIR__ . '/../config/config.php')) {
    jsonError("Config file not found", 500);
}
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// 4. Authentication
try {
    $user = AuthMiddleware::validateJWT();
} catch (Exception $e) {
    jsonError("Authentication Failed", 401, $e->getMessage());
}

// 5. Logic (Copied from PagosController)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError("Method Not Allowed", 405);
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    jsonError("Invalid JSON Input", 400);
}

$cliente_id = $input['cliente_id'] ?? null;
$monto_abono = floatval($input['monto'] ?? 0);
$metodo_pago = $input['metodo_pago'] ?? 'efectivo';
$referencia = $input['referencia'] ?? '';

if (!$cliente_id || $monto_abono <= 0) {
    jsonError("Cliente y monto son obligatorios", 400);
}

try {
    // A. Obtener Ventas del Cliente
    $ventasResponse = Database::query('ventas', [
        'select' => 'id',
        'cliente_id' => 'eq.' . $cliente_id,
        'metodo_pago' => 'eq.cuotas'
    ]);

    if ($ventasResponse['status'] >= 400) {
        throw new Exception("Error al obtener ventas: " . json_encode($ventasResponse));
    }

    $ventas = $ventasResponse['data'];
    if (empty($ventas)) {
        echo json_encode(["message" => "El cliente no tiene ventas a crédito", "monto_abonado" => 0, "detalle" => []]);
        exit;
    }

    $ventaIds = array_column($ventas, 'id');
    $ventaIdsString = '(' . implode(',', $ventaIds) . ')';

    // B. Obtener Cuotas Pendientes
    $cuotasResponse = Database::query('cuotas', [
        'select' => 'id, monto, monto_pagado, fecha_vencimiento, estado, venta_id',
        'venta_id' => 'in.' . $ventaIdsString,
        'estado' => 'neq.pagado',
        'order' => 'fecha_vencimiento.asc'
    ]);

    if ($cuotasResponse['status'] >= 400) {
        throw new Exception("Error al obtener cuotas: " . json_encode($cuotasResponse));
    }

    $allCuotas = $cuotasResponse['data'];
    $remanente = $monto_abono;
    $pagosRealizados = [];

    // C. Procesar Pagos
    foreach ($allCuotas as $cuota) {
        if ($remanente <= 0.01)
            break;

        $deuda_actual = floatval($cuota['monto']) - floatval($cuota['monto_pagado'] ?? 0);
        $pago_aplicable = min($remanente, $deuda_actual);

        $nuevo_pagado = floatval($cuota['monto_pagado'] ?? 0) + $pago_aplicable;
        $es_total = $nuevo_pagado >= (floatval($cuota['monto']) - 0.01);
        $nuevo_estado = $es_total ? 'pagado' : 'pendiente';

        // Update Cuota
        $updateRes = Database::update('cuotas', [
            'monto_pagado' => $nuevo_pagado,
            'estado' => $nuevo_estado
        ], ['id' => 'eq.' . $cuota['id']]);

        if ($updateRes['status'] >= 400) {
            throw new Exception("Error updating cuota " . $cuota['id']);
        }

        // Insert Historial
        Database::insert('historial_pagos', [
            'venta_id' => $cuota['venta_id'],
            'cuota_id' => $cuota['id'],
            'cliente_id' => $cliente_id,
            'usuario_id' => $user['sub'] ?? null,
            'monto' => $pago_aplicable,
            'metodo_pago' => $metodo_pago,
            'referencia' => $referencia . ' (Direct API)'
        ]);

        $pagosRealizados[] = [
            'cuota_id' => $cuota['id'],
            'pagado' => $pago_aplicable,
            'estado' => $nuevo_estado
        ];

        $remanente -= $pago_aplicable;
    }

    echo json_encode([
        "message" => "Abono procesado correctamente",
        "monto_abonado" => $monto_abono - $remanente,
        "remanente_favor" => $remanente,
        "detalle" => $pagosRealizados
    ]);

} catch (Exception $e) {
    jsonError("Error interno", 500, $e->getMessage());
}
