<?php
// backend/controllers/UploadController.php

require_once __DIR__ . '/../config/Database.php';

class UploadController
{
    public function handleRequest()
    {
        header('Content-Type: application/json');

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $this->uploadFile();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
    }

    private function uploadFile()
    {
        if (!isset($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(['error' => 'No se ha subido ningún archivo']);
            return;
        }

        $file = $_FILES['file'];

        // Validar errores de subida
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'Error al subir archivo: ' . $file['error']]);
            return;
        }

        // Validar tipo de archivo (solo imágenes)
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'Tipo de archivo no permitido. Solo JPG, PNG, GIF o WEBP.']);
            return;
        }

        // Crear directorio uploads si no existe
        $uploadDir = __DIR__ . '/../uploads/productos/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Generar nombre único
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = uniqid('prod_', true) . '.' . $extension;
        $targetPath = $uploadDir . $fileName;

        // Mover archivo
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            // Construir URL pública (ajustar según tu configuración de servidor)
            // Asumimos que el backend se sirve desde localhost:8000 o similar
            // La URL base debe coincidir con como accedes a las imágenes desde el frontend

            // NOTA: Para desarrollo local con PHP built-in server, las imágenes en root/uploads son accesibles
            // si el root del servidor es backend/

            // Get base URL logic
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];

            // Ajuste para devolver la ruta relativa o absoluta según convenga
            // En este caso devolvemos ruta relativa a la raíz del backend para que el frontend la consuma
            // Si el frontend está en otro puerto, necesitarás la URL completa.
            // Asumiendo que el backend corre en puerto 8000 y frontend en 5173

            $publicUrl = "$protocol://$host/uploads/productos/$fileName";

            echo json_encode([
                'message' => 'Archivo subido correctamente',
                'url' => $publicUrl
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error al guardar el archivo en el servidor']);
        }
    }
}

// Instanciar y manejar
$controller = new UploadController();
$controller->handleRequest();
