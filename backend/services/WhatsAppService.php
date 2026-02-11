<?php
// backend/services/WhatsAppService.php

namespace App\Services;

use GuzzleHttp\Client;
use Exception;

class WhatsAppService
{
    private $client;
    private $token;
    private $phoneId;
    private $productId;

    public function __construct($token, $phoneId, $productId)
    {
        $this->token = $token;
        $this->phoneId = $phoneId;
        $this->productId = $productId;

        if (!$this->token || !$this->phoneId || !$this->productId) {
            throw new Exception("Credenciales de Maytapi no configuradas.");
        }

        $this->client = new Client([
            'base_uri' => 'https://api.maytapi.com/api/',
            'headers' => [
                'x-maytapi-key' => $this->token,
                'Content-Type' => 'application/json',
            ],
            // Disable SSL verification for local dev if needed
            'verify' => false
        ]);
    }

    public function sendTextMessage($to, $message)
    {
        try {
            // Maytapi format: /api/{product_id}/{phone_id}/sendMessage
            $response = $this->client->post("{$this->productId}/{$this->phoneId}/sendMessage", [
                'json' => [
                    'to_number' => $to,
                    'type' => 'text',
                    'message' => $message
                ]
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (Exception $e) {
            error_log("Error enviando Maytapi (Texto): " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    public function sendTemplateMessage($to, $templateName, $languageCode = 'es', $components = [])
    {
        try {
            $response = $this->client->post($this->phoneId . '/messages', [
                'json' => [
                    'messaging_product' => 'whatsapp',
                    'to' => $to,
                    'type' => 'template',
                    'template' => [
                        'name' => $templateName,
                        'language' => ['code' => $languageCode],
                        'components' => $components
                    ]
                ]
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (Exception $e) {
            error_log("Error enviando WhatsApp (Plantilla): " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    public function sendInvoiceNotification($to, $clientName, $orderId, $total)
    {
        $components = [
            [
                'type' => 'body',
                'parameters' => [
                    ['type' => 'text', 'text' => $clientName],
                    ['type' => 'text', 'text' => $orderId],
                    ['type' => 'text', 'text' => '$' . number_format($total, 2)],
                ]
            ]
        ];

        return $this->sendTemplateMessage($to, 'factura_generada', 'es', $components);
    }
}
