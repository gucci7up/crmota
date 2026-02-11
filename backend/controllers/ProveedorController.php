<?php
// backend/controllers/ProveedorController.php

class ProveedorController
{
    public function handle($method, $action)
    {
        switch ($method) {
            case 'GET':
                $this->listSuppliers();
                break;
            case 'POST':
                $this->addSupplier();
                break;
            default:
                http_response_code(405);
        }
    }

    private function listSuppliers()
    {
        // En producción: Database::query('proveedores')
        echo json_encode(["suppliers" => []]);
    }

    private function addSupplier()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        echo json_encode(["status" => "success", "message" => "Proveedor añadido"]);
    }
}

$controller = new ProveedorController();
$controller->handle($_SERVER['REQUEST_METHOD'], $action);
