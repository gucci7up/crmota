<?php
// backend/controllers/WhatsAppController.php

require_once __DIR__ . '/../services/WhatsAppService.php';

class WhatsAppController
{
    private $whatsappService;

    public function __construct()
    {
        $this->whatsappService = new \App\Services\WhatsAppService();
    }

    public function handle($method)
    {
        if ($method === 'GET') {
            // Verificación del webhook por Meta
            $this->verifyWebhook();
        } elseif ($method === 'POST') {
            // Recepción de mensajes / estados
            $this->receiveMessage();
        }
    }

    private function verifyWebhook()
    {
        $verify_token = $_ENV['WHATSAPP_VERIFY_TOKEN'] ?? 'crmota_token';
        $mode = $_GET['hub_mode'] ?? '';
        $token = $_GET['hub_verify_token'] ?? '';
        $challenge = $_GET['hub_challenge'] ?? '';

        if ($mode === 'subscribe' && $token === $verify_token) {
            echo $challenge;
            exit;
        }

        http_response_code(403);
    }

    private function receiveMessage()
    {
        $data = json_decode(file_get_contents('php://input'), true);

        // Lógica para procesar respuestas de clientes
        // Se puede guardar en base de datos o disparar notificaciones
        error_log("WhatsApp Webhook received: " . json_encode($data));

        echo json_encode(["status" => "success"]);
    }
}

$controller = new WhatsAppController();
$controller->handle($_SERVER['REQUEST_METHOD']);
