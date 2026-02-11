<?php
// backend/controllers/VentaController.php

class VentaController
{
    public function handle($method, $action)
    {
        switch ($method) {
            case 'POST':
                if ($action === 'crear') {
                    $this->createSale();
                }
                break;
            case 'GET':
                if ($action === 'recientes') {
                    $this->getRecentSales();
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(["error" => "Método no permitido"]);
        }
    }

    private function createSale()
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['items']) || empty($data['items'])) {
            http_response_code(400);
            echo json_encode(["error" => "No hay productos en la venta"]);
            return;
        }

        // 1. Insertar en tabla 'ventas'
        $isCuotas = ($data['metodo_pago'] ?? '') === 'cuotas';

        $ventaData = [
            'usuario_id' => $data['usuario_id'],
            'cliente_id' => $data['cliente_id'] ?? null,
            'total' => $data['total'],
            'metodo_pago' => $data['metodo_pago'] ?? 'efectivo',
            'estado_pago' => $isCuotas ? 'pendiente' : 'pagado'
        ];

        $ventaRes = Database::insert('ventas', $ventaData);
        if ($ventaRes['status'] >= 400) {
            http_response_code(500);
            echo json_encode(["error" => "Error al crear venta", "details" => $ventaRes['data']]);
            return;
        }

        $ventaId = $ventaRes['data'][0]['id'];

        // 2. Insertar items en 'detalle_ventas'
        foreach ($data['items'] as $item) {
            // Obtener el precio de compra actual del producto para el reporte de ganancias
            $prodCost = Database::query('productos', [
                'id' => 'eq.' . $item['id'],
                'select' => 'precio_compra'
            ]);
            $costoUnitario = ($prodCost['status'] == 200 && !empty($prodCost['data']))
                ? $prodCost['data'][0]['precio_compra']
                : 0;

            $detalleData = [
                'venta_id' => $ventaId,
                'producto_id' => $item['id'],
                'cantidad' => $item['cantidad'],
                'precio_unitario' => $item['precio'],
                'costo_unitario' => $costoUnitario,
                'subtotal' => $item['precio'] * $item['cantidad']
            ];
            Database::insert('detalle_ventas', $detalleData);

            // 3. Insertar cuotas si es venta al crédito
            if ($isCuotas && isset($data['cuotas'])) {
                foreach ($data['cuotas'] as $cuota) {
                    $cuotaData = [
                        'venta_id' => $ventaId,
                        'monto' => $cuota['monto'],
                        'fecha_vencimiento' => $cuota['fecha_vencimiento'],
                        'estado' => 'pendiente'
                    ];
                    Database::insert('cuotas', $cuotaData);
                }
            }

            // 4. Actualizar stock en 'productos'
            // En un caso real, esto debería ser atómico
            $prodRes = Database::query('productos', ['id' => 'eq.' . $item['id'], 'select' => 'stock']);
            if ($prodRes['status'] == 200 && !empty($prodRes['data'])) {
                $newStock = $prodRes['data'][0]['stock'] - $item['cantidad'];
                Database::update('productos', ['stock' => $newStock], ['id' => 'eq.' . $item['id']]);
            }
        }

        // 4. Enviar WhatsApp si hay teléfono del cliente
        if (!empty($data['cliente_telefono'])) {
            require_once __DIR__ . '/../services/WhatsAppService.php';
            $ws = new \App\Services\WhatsAppService();
            $ws->sendInvoiceNotification(
                $data['cliente_telefono'],
                $data['cliente_nombre'] ?? 'Cliente',
                $ventaId,
                $data['total']
            );
        }

        echo json_encode([
            "status" => "success",
            "message" => "Venta procesada exitosamente",
            "sale_id" => $ventaId
        ]);
    }

    private function getRecentSales()
    {
        // En un caso real, usaríamos Database::query('ventas', ['limit' => 10])
        echo json_encode(["sales" => []]);
    }
}

$controller = new VentaController();
$controller->handle($_SERVER['REQUEST_METHOD'], $action);
