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
        $input = json_decode(file_get_contents("php://input"), true);

        $cliente_id = $input['cliente_id'] ?? null;
        $monto_abono = floatval($input['monto'] ?? 0);
        $metodo_pago = $input['metodo_pago'] ?? 'efectivo'; // efectivo, transferencia, tarjeta
        $referencia = $input['referencia'] ?? '';

        if (!$cliente_id || $monto_abono <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Cliente y monto son obligatorios"]);
            return;
        }

        try {
            // URL params: select=id,cuotas(*)&cliente_id=eq.UUID&metodo_pago=eq.cuotas
            // Note: We use manual cURL here for precise control over the nested select syntax
            $url = SUPABASE_URL . "/rest/v1/ventas?select=id,cuotas(*)&cliente_id=eq.$cliente_id&metodo_pago=eq.cuotas";

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "apikey: " . SUPABASE_KEY,
                "Authorization: Bearer " . SUPABASE_KEY,
            ]);
            $resp = curl_exec($ch);
            $curlError = curl_error($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($resp === false) {
                throw new Exception("Error connecting to Supabase: " . $curlError);
            }

            if ($httpCode >= 400) {
                throw new Exception("Supabase Error ($httpCode): " . $resp);
            }

            $ventas = json_decode($resp, true);

            if (!is_array($ventas)) {
                throw new Exception("Invalid response from Supabase when fetching debt details: " . substr($resp, 0, 100));
            }

            $allCuotas = [];
            foreach ($ventas as $venta) {
                if (!empty($venta['cuotas']) && is_array($venta['cuotas'])) {
                    foreach ($venta['cuotas'] as $c) {
                        if ($c['estado'] !== 'pagado') {
                            $c['venta_id'] = $venta['id']; // Inject parent venta_id
                            $allCuotas[] = $c;
                        }
                    }
                }
            }

            // Ordenar por vencimiento (antiguas primero)
            usort($allCuotas, function ($a, $b) {
                return strtotime($a['fecha_vencimiento']) - strtotime($b['fecha_vencimiento']);
            });

            $remanente = $monto_abono;
            $pagosRealizados = [];

            foreach ($allCuotas as $cuota) {
                if ($remanente <= 0.01)
                    break;

                $deuda_actual = floatval($cuota['monto']) - floatval($cuota['monto_pagado'] ?? 0);

                // Cuanto pagamos de esta cuota
                $pago_aplicable = min($remanente, $deuda_actual);

                // Nuevo estado
                $nuevo_pagado = floatval($cuota['monto_pagado'] ?? 0) + $pago_aplicable;
                $es_total = $nuevo_pagado >= (floatval($cuota['monto']) - 0.01);
                $nuevo_estado = $es_total ? 'pagado' : 'pendiente';

                // Actualizar cuota en BD
                Database::update('cuotas', [
                    'monto_pagado' => $nuevo_pagado,
                    'estado' => $nuevo_estado
                ], ['id' => 'eq.' . $cuota['id']]);

                // Registrar en historial (Individual por cuota para trazabilidad exacta)
                Database::insert('historial_pagos', [
                    'venta_id' => $cuota['venta_id'],
                    'cuota_id' => $cuota['id'],
                    'cliente_id' => $cliente_id,
                    'usuario_id' => $user['sub'] ?? null, // ID del usuario autenticado
                    'monto' => $pago_aplicable,
                    'metodo_pago' => $metodo_pago,
                    'referencia' => $referencia . " (Abono Global)"
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
                "remanente_favor" => $remanente, // Si pagó de más, queda como saldo a favor (future feature)
                "detalle" => $pagosRealizados
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al procesar pago: " . $e->getMessage()]);
        }
    }
}
