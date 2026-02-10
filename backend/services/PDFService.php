<?php
// backend/services/PDFService.php

namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;

class PDFService
{
    public function generateInvoicePDF($orderData)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);

        // Plantilla HTML básica (se puede mejorar significativamente)
        $html = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .header { text-align: center; margin-bottom: 20px; }
                .details { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2 f2 f2; }
                .total { text-align: right; margin-top: 20px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class='header'>
                <h1>FACTURA DE VENTA</h1>
                <p>Orden #: " . ($orderData['id'] ?? 'N/A') . "</p>
            </div>
            <div class='details'>
                <p><strong>Cliente:</strong> " . ($orderData['cliente_nombre'] ?? 'Mostrador') . "</p>
                <p><strong>Fecha:</strong> " . date('Y-m-d H:i') . "</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cant</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>";

        foreach ($orderData['items'] as $item) {
            $html .= "
                <tr>
                    <td>" . $item['nombre'] . "</td>
                    <td>" . $item['cantidad'] . "</td>
                    <td>$" . number_format($item['precio_unitario'], 2) . "</td>
                    <td>$" . number_format($item['subtotal'], 2) . "</td>
                </tr>";
        }

        $html .= "
                </tbody>
            </table>
            <div class='total'>
                <p>TOTAL: $" . number_format($orderData['total'], 2) . "</p>
            </div>
        </body>
        </html>";

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}
