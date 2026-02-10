<?php
// backend/controllers/ClienteController.php

class ClienteController
{
    public function handle($method, $action)
    {
        // Aquí iría la lógica de CRUD conectando a Supabase vía API o PDO.
        // Dado que Supabase ya provee una API REST potente, 
        // el backend PHP se usará para procesos que requieran lógica de servidor.

        switch ($method) {
            case 'GET':
                // Ejemplo de reporte complejo de historial de compras
                $this->getHistory();
                break;
            default:
                echo json_encode(["message" => "Metodo no soportado"]);
        }
    }

    private function getHistory()
    {
        echo json_encode(["history" => []]);
    }
}

// Instantiate and handle
$controller = new ClienteController();
$controller->handle($_SERVER['REQUEST_METHOD'], $action);
