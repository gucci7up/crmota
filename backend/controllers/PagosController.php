<?php
// backend/controllers/PagosController.php

class PagosController
{
    public function handle($method, $action)
    {
        $userData = AuthMiddleware::validateJWT();

        switch ($method) {
            case 'POST':
                if ($action === 'registrar') {
                    $this->registrarAbono($userData);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Acción no encontrada"]);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(["error" => "Método no permitido"]);
        }
    }

    private function registrarAbono($user)
    {
        // 1. Validar Entrada
        $input = json_decode(file_get_contents("php://input"), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid JSON Input"]);
            return;
        }

        $cliente_id = $input['cliente_id'] ?? null;
        $monto_abono = floatval($input['monto'] ?? 0);
        $metodo_pago = $input['metodo_pago'] ?? 'efectivo';
        $referencia = $input['referencia'] ?? '';

        if (!$cliente_id || $monto_abono <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Cliente y monto son obligatorios"]);
            return;
        }

        try {
            // 2. Obtener Ventas del Cliente (Solo ID)
            // Filtramos ventas que son a crédito ('cuotas')
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
                return;
            }

            // Extraer IDs de ventas
            $ventaIds = array_column($ventas, 'id');

            // 3. Obtener Cuotas Pendientes de esas Ventas
            // Supabase soporta filtro "in" con formato: (val1,val2,val3)
            $ventaIdsString = '(' . implode(',', $ventaIds) . ')';

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

            // 4. Procesar Pagos (FIFO)
            $remanente = $monto_abono;
            $pagosRealizados = [];

            foreach ($allCuotas as $cuota) {
                if ($remanente <= 0.01)
                    break;

                $deuda_actual = floatval($cuota['monto']) - floatval($cuota['monto_pagado'] ?? 0);
                $pago_aplicable = min($remanente, $deuda_actual);

                // Calcular nuevo estado
                $nuevo_pagado = floatval($cuota['monto_pagado'] ?? 0) + $pago_aplicable;
                $es_total = $nuevo_pagado >= (floatval($cuota['monto']) - 0.01);
                $nuevo_estado = $es_total ? 'pagado' : 'pendiente';

                // Update Cuota
                $updateRes = Database::update('cuotas', [
                    'monto_pagado' => $nuevo_pagado,
                    'estado' => $nuevo_estado
                ], ['id' => 'eq.' . $cuota['id']]);

                if ($updateRes['status'] >= 400) {
                    // Log error but continue? No, simpler to stop/throw to avoid partial inconsistencies without transaction
                    throw new Exception("Error updating cuota " . $cuota['id']);
                }

                // Insert into Historial
                Database::insert('historial_pagos', [
                    'venta_id' => $cuota['venta_id'],
                    'cuota_id' => $cuota['id'],
                    'cliente_id' => $cliente_id,
                    'usuario_id' => $user['sub'] ?? null,
                    'monto' => $pago_aplicable,
                    'metodo_pago' => $metodo_pago,
                    'referencia' => $referencia . ' (Auto)'
                ]);

                $pagosRealizados[] = [
                    'cuota_id' => $cuota['id'],
                    'pagado' => $pago_aplicable,
                    'estado' => $nuevo_estado
                ];

                $remanente -= $pago_aplicable;
            }

            // 5. Respuesta Exitosa
            echo json_encode([
                "message" => "Abono procesado correctamente",
                "monto_abonado" => $monto_abono - $remanente,
                "remanente_favor" => $remanente,
                "detalle" => $pagosRealizados
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                "error" => "Error interno al procesar pago",
                "details" => $e->getMessage()
            ]);
        }
    }
}

// Instantiate and handle
$controller = new PagosController();
$controller->handle($_SERVER['REQUEST_METHOD'], $action);
