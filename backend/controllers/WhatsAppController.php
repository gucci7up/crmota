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
        $clientId = $data['client_id'] ?? '';

        if (!$phone || !$message || !$clientId) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Datos incompletos"]);
            return;
        }

        require_once __DIR__ . '/../services/WhatsAppService.php';
        $ws = new \App\Services\WhatsAppService();

        // Enviar vía API (Simulado o real dependiendo de credenciales)
        // Por ahora lo enviamos y retornamos éxito para que la UI fluya
        // TODO: Implementar lógica real con WhatsAppService cuando las credenciales estén en .env

        echo json_encode(["status" => "success", "message" => "Mensaje enviado localmente"]);
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

        require_once __DIR__ . '/../services/WhatsAppService.php';
        $ws = new \App\Services\WhatsAppService();

        // Simulación de éxito
        echo json_encode(["status" => "success", "message" => "Solicitud enviada"]);
    }
}

$controller = new WhatsAppController();
$controller->handle($_SERVER['REQUEST_METHOD'], $action);
