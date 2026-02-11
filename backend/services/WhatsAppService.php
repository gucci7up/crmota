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

    public function __construct($token, $phoneId)
    {
        $this->token = $token;
        $this->phoneId = $phoneId;

        if (!$this->token || !$this->phoneId) {
            throw new Exception("Credenciales de WhatsApp no configuradas.");
        }

        $this->client = new Client([
            'base_uri' => 'https://graph.facebook.com/v18.0/',
            'headers' => [
                'Authorization' => 'Bearer ' . $this->token,
                'Content-Type' => 'application/json',
            ],
            // Disable SSL verification for local dev if needed, strictly for production use true
            'verify' => false
        ]);
    }

    public function sendTextMessage($to, $message)
    {
        try {
            $response = $this->client->post($this->phoneId . '/messages', [
                'json' => [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $to,
                    'type' => 'text',
                    'text' => [
                        'preview_url' => false,
                        'body' => $message
                    ]
                ]
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (Exception $e) {
            error_log("Error enviando WhatsApp (Texto): " . $e->getMessage());
            // Return error structure similar to success for consistency in controller handling
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
