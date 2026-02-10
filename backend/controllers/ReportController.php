<?php
// backend/controllers/ReportController.php

require_once __DIR__ . '/../services/PDFService.php';

class ReportController
{
    private $pdfService;

    public function __construct()
    {
        $this->pdfService = new \App\Services\PDFService();
    }

    public function handle($method, $action)
    {
        if ($action === 'invoice') {
            $this->generateInvoice();
        }
    }

    private function generateInvoice()
    {
        // En una implementación real, se obtendrían de la base de datos usando el ID de la venta
        $id = $_GET['id'] ?? null;

        $mockData = [
            'id' => $id,
            'cliente_nombre' => 'Juan Perez',
            'total' => 150.50,
            'items' => [
                ['nombre' => 'Producto A', 'cantidad' => 2, 'precio_unitario' => 50, 'subtotal' => 100],
                ['nombre' => 'Producto B', 'cantidad' => 1, 'precio_unitario' => 50.50, 'subtotal' => 50.50],
            ]
        ];

        $pdf = $this->pdfService->generateInvoicePDF($mockData);

        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="invoice.pdf"');
        echo $pdf;
    }
}

$controller = new ReportController();
$controller->handle($_SERVER['REQUEST_METHOD'], $action);
