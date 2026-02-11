<?php
// backend/controllers/CategoriaController.php

require_once __DIR__ . '/../config/Database.php';

class CategoriaController
{
    public function handleRequest($action)
    {
        header('Content-Type: application/json');

        // Extraer token de autorización de los headers de la petición entrante
        $authHeader = null;
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? null;
        }

        if ($authHeader) {
            Database::setToken($authHeader);
        }

        switch ($_SERVER['REQUEST_METHOD']) {
            case 'GET':
                $this->getAll();
                break;
            case 'POST':
                $this->create();
                break;
            default:
                http_response_code(405);
                echo json_encode(['error' => 'Método no permitido']);
        }
    }

    private function getAll()
    {
        // Usar el wrapper de Database para consultar a Supabase
        // Supabase REST API: GET /rest/v1/categorias?select=*&order=nombre.asc
        // Database::query construye la URL con query params
        $response = Database::query('categorias', [
            'select' => '*',
            'order' => 'nombre.asc'
        ]);

        if ($response['status'] >= 200 && $response['status'] < 300) {
            echo json_encode($response['data']);
        } else {
            http_response_code($response['status']);
            echo json_encode(['error' => 'Error al obtener categorías', 'details' => $response['data']]);
        }
    }

    private function create()
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['nombre']) || empty(trim($data['nombre']))) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre de la categoría es obligatorio']);
            return;
        }

        // Usar Database::insert
        $payload = ['nombre' => trim($data['nombre'])];
        $response = Database::insert('categorias', $payload);

        if ($response['status'] >= 200 && $response['status'] < 300) {
            http_response_code(201);
            // Supabase devuelve el objeto creado si se usa Prefer: return=representation (que está en Database.php)
            $created = $response['data'][0] ?? $payload;
            echo json_encode([
                'message' => 'Categoría creada exitosamente',
                'categoria' => $created
            ]);
        } else {
            http_response_code($response['status']);
            echo json_encode(['error' => 'Error al crear categoría', 'details' => $response['data']]);
        }
    }
}

$controller = new CategoriaController();
$controller->handleRequest(null);
