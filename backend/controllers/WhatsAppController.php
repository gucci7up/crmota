<?php
// backend/controllers/WhatsAppController.php

class WhatsAppController
{
    public function handle($method, $action)
    {
        switch ($method) {
            case 'POST':
                if ($action === 'send') {
                    $this->sendMessage();
                } else if ($action === 'send-invoice') {
                    $this->sendInvoice();
                }
                break;
            case 'GET':
                if ($action === 'webhook') {
                    $this->verifyWebhook();
                }
                break;
            default:
                http_response_code(405);
        }
    }

    private function verifyWebhook()
    {
        $verify_token = "CRMota_Verify_Token"; // Esto debería venir de config
        $mode = $_GET['hub_mode'] ?? '';
        $token = $_GET['hub_verify_token'] ?? '';
        $challenge = $_GET['hub_challenge'] ?? '';

        if ($mode === 'subscribe' && $token === $verify_token) {
            echo $challenge;
        } else {
            http_response_code(403);
        }
    }

    private function sendMessage()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $phone = $data['phone'] ?? '';
        $message = $data['message'] ?? '';
        // $clientId = $data['client_id'] ?? ''; // Not strictly needed for sending, but useful for logging

        if (!$phone || !$message) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Datos incompletos"]);
            return;
        }

        // 1. Obtener credenciales del usuario actual (AuthMiddleware ya validó el token)
        $userData = AuthMiddleware::validateJWT();
        $userId = $userData['sub'];

        // Usamos la clase Database para obtener las credenciales del perfil
        $profileResponse = \Database::query('profiles', [
            'select' => 'whatsapp_token,whatsapp_phone_id',
            'id' => 'eq.' . $userId,
            'limit' => 1
        ]);

        if ($profileResponse['status'] >= 400 || empty($profileResponse['data'])) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "No se pudo obtener la configuración del usuario"]);
            return;
        }

        $profile = $profileResponse['data'][0];
        $token = $profile['whatsapp_token'] ?? '';
        $phoneId = $profile['whatsapp_phone_id'] ?? '';

        if (!$token || !$phoneId) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Credenciales de WhatsApp no configuradas. Ve a Configuración."]);
            return;
        }

        try {
            require_once __DIR__ . '/../services/WhatsAppService.php';
            $ws = new \App\Services\WhatsAppService($token, $phoneId);

            $result = $ws->sendTextMessage($phone, $message);

            if (isset($result['error'])) {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Facebook API Error: " . json_encode($result['error'])]);
            } else {
                echo json_encode(["status" => "success", "data" => $result]);
            }

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    private function sendInvoice()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $phone = $data['phone'] ?? '';
        $invoice_id = $data['invoice_id'] ?? '';

        if (!$phone || !$invoice_id) {
            http_response_code(400);
            echo json_encode(["error" => "Teléfono e ID de factura requeridos"]);
            return;
        }

        // 1. Obtener credenciales del usuario actual
        $userData = AuthMiddleware::validateJWT();
        $userId = $userData['sub'];

        $profileResponse = \Database::query('profiles', [
            'select' => 'whatsapp_token,whatsapp_phone_id',
            'id' => 'eq.' . $userId,
            'limit' => 1
        ]);

        if ($profileResponse['status'] >= 400 || empty($profileResponse['data'])) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "No se pudo obtener la configuración del usuario"]);
            return;
        }

        $profile = $profileResponse['data'][0];
        $token = $profile['whatsapp_token'] ?? '';
        $phoneId = $profile['whatsapp_phone_id'] ?? '';
        $empresa = $profile['empresa_nombre'] ?? 'CRMota';

        if (!$token || !$phoneId) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Credenciales no configuradas"]);
            return;
        }

        try {
            require_once __DIR__ . '/../services/WhatsAppService.php';
            $ws = new \App\Services\WhatsAppService($token, $phoneId);

            // TODO: Obtener datos reales de la orden/factura si es necesario
            $total = 0; // Placeholder
            $result = $ws->sendInvoiceNotification($phone, $empresa, $invoice_id, $total);

            if (isset($result['error'])) {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "API Error: " . json_encode($result['error'])]);
            } else {
                echo json_encode(["status" => "success", "message" => "Notificación enviada"]);
            }

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
}

$controller = new WhatsAppController();
$controller->handle($_SERVER['REQUEST_METHOD'], $action);
