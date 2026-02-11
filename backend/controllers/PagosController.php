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
            // 1. Obtener todas las cuotas pendientes del cliente (ordenadas por fecha_vencimiento ASC)
            $response = Database::query('cuotas', [
                'select' => 'id, monto, monto_pagado, fecha_vencimiento, estado, venta_id',
                'venta_id.cliente_id' => $cliente_id, // Join implícito en Supabase si está bien configurado el FK, sino mejor filtrar por ventas
                'order' => 'fecha_vencimiento.asc'
                // Nota: El filtro directo por cliente_id en cuotas requiere un join. 
                // Simplificación: Traemos las cuotas vinculadas a ventas de este cliente.
                // Supabase PostgREST sintaxis para nested filter: ventas!inner(cliente_id)
            ]);

            // Corrección: Usar la relación para filtrar.
            // URL params: select=*,ventas!inner(cliente_id)&ventas.cliente_id=eq.UUID&order=fecha_vencimiento.asc
            // Dado que Database::query es un wrapper simple, construyamos la query param manualmente o ajustemos el wrapper.
            // Ajuste temporal: Traer todas las ventas del cliente y luego sus cuotas, o usar una query más precisa.
            
            // Opción B: Query directa a `cuotas` filtrando por las ventas del cliente.
            // Para asegurar precisión y evitar complejidad en el wrapper simple, haremos:
            // 1. Obtener ventas con deuda. 
            // 2. Obtener cuotas de esas ventas.
            
            // Mejor opción con el wrapper actual:
            // "ventas?select=id,cuotas(*)&cliente_id=eq.$cliente_id"
            
            $url = SUPABASE_URL . "/rest/v1/ventas?select=id,cuotas(*)&cliente_id=eq.$cliente_id&metodo_pago=eq.cuotas";
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "apikey: " . SUPABASE_KEY,
                "Authorization: Bearer " . SUPABASE_KEY,
            ]);
            $resp = curl_exec($ch);
            curl_close($ch);
            
            $ventas = json_decode($resp, true);
            
            $allCuotas = [];
            foreach ($ventas as $venta) {
                if (!empty($venta['cuotas'])) {
                    foreach ($venta['cuotas'] as $c) {
                        if ($c['estado'] !== 'pagado') {
                            $allCuotas[] = $c;
                        }
                    }
                }
            }
            
            // Ordenar por vencimiento (antiguas primero)
            usort($allCuotas, function($a, $b) {
                return strtotime($a['fecha_vencimiento']) - strtotime($b['fecha_vencimiento']);
            });

            $remanente = $monto_abono;
            $pagosRealizados = [];

            foreach ($allCuotas as $cuota) {
                if ($remanente <= 0.01) break;

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
