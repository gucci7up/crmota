<?php
// backend/controllers/ProductoController.php

class ProductoController
{
    public function handle($method, $action)
    {
        switch ($method) {
            case 'GET':
                if ($action === 'stats') {
                    $this->getInventoryStats();
                } else {
                    $this->listProducts();
                }
                break;
            case 'POST':
                if ($action === 'adjust-stock') {
                    $this->adjustStock();
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(["error" => "Método no permitido"]);
        }
    }

    private function getInventoryStats()
    {
        // En un entorno real, aquí se consultaría a la base de datos (PDO o Supabase API)
        // Ejemplo de respuesta estructurada
        $stats = [
            "total_products" => 1240,
            "low_stock_count" => 12,
            "out_of_stock" => 3,
            "categories_count" => 8,
            "total_value" => 45890.50
        ];
        echo json_encode($stats);
    }

    private function listProducts()
    {
        // Simulación de listado
        echo json_encode(["products" => []]);
    }

    private function adjustStock()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['product_id']) || !isset($data['adjustment'])) {
            http_response_code(400);
            echo json_encode(["error" => "Datos incompletos"]);
            return;
        }

        // Lógica de ajuste de stock
        echo json_encode(["status" => "success", "message" => "Stock ajustado correctamente"]);
    }
}

$controller = new ProductoController();
$controller->handle($_SERVER['REQUEST_METHOD'], $action);
