export class EscPos {
    constructor() {
        this.buffer = [];
    }

    // Initialize printer
    init() {
        this.buffer.push(0x1B, 0x40);
        return this;
    }

    // Text alignment: 0=Left, 1=Center, 2=Right
    align(align) {
        this.buffer.push(0x1B, 0x61, align);
        return this;
    }

    // Bold text: 1=On, 0=Off
    bold(on) {
        this.buffer.push(0x1B, 0x45, on ? 1 : 0);
        return this;
    }

    // Text size: 0x00=Normal, 0x11=DoubleHeight+Width
    size(s) {
        this.buffer.push(0x1D, 0x21, s);
        return this;
    }

    // Add text with encoding (simple ASCII/CP437 fallback for now)
    text(text) {
        if (!text) return this;
        // Simple transliteration to remove accents for basic printers
        const cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        for (let i = 0; i < cleanText.length; i++) {
            this.buffer.push(cleanText.charCodeAt(i));
        }
        return this;
    }

    // Add text with newline
    textLine(text) {
        this.text(text);
        this.buffer.push(0x0A);
        return this;
    }

    // Feed lines
    feed(n = 1) {
        this.buffer.push(0x1B, 0x64, n);
        return this;
    }

    // Cut paper (Partial cut implementation)
    cut() {
        this.buffer.push(0x1D, 0x56, 66, 0);
        return this;
    }

    // Get raw Uint8Array buffer
    getBuffer() {
        return new Uint8Array(this.buffer);
    }
}

export const printInvoiceBluetooth = async (invoice, format = '58mm') => {
    if (!navigator.bluetooth) {
        throw new Error("Su navegador no soporta Bluetooth Web (Use Chrome en Android/PC).");
    }

    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }], // Standard 18f0 service often used
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'] // Add generic serial
        }).catch(err => {
            // Fallback to accepting all devices if filter fails (user selects manually)
            return navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });
        });

        const server = await device.gatt.connect();
        // Try to find the characteristic for writing
        // Common UUIDs for Serial/Printing
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb').catch(async () => {
            // Fallback logic could go here, but for now we try the standard standard
            throw new Error("No se pudo conectar al servicio de impresión.");
        });

        const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb'); // Standard write char

        const encoder = new EscPos();
        const width = format === '80mm' ? 48 : 32; // Approx char width for standard font

        encoder.init()
            .align(1).bold(true).size(0x11).textLine("CRMota Store").size(0x00).bold(false)
            .textLine("Av. Principal 123, Santiago")
            .textLine("+56 9 1234 5678")
            .feed(1)
            .align(0)
            .textLine(`VENTA #${invoice.id}`)
            .textLine(`FECHA: ${new Date(invoice.created_at).toLocaleDateString()} ${new Date(invoice.created_at).toLocaleTimeString()}`)
            .textLine(`CLIENTE: ${invoice.clientes?.nombre || 'General'}`)
            .textLine("-".repeat(width))
            .bold(true).text("ITEM").align(2).textLine("TOTAL").bold(false).align(0);

        invoice.detalle_ventas.forEach(item => {
            const name = item.productos?.nombre || 'Item';
            const qty = item.cantidad;
            const price = item.subtotal; // Using subtotal for simplicity in this view

            encoder.textLine(name)
                .text(`${qty} x $${price / qty} = `).align(2).textLine(`$${price}`).align(0);
        });

        encoder.textLine("-".repeat(width))
            .align(2).bold(true).size(0x01)
            .textLine(`TOTAL: $${invoice.total}`)
            .size(0x00).bold(false).align(1)
            .feed(2)
            .textLine("GRACIAS POR SU PREFERENCIA")
            .feed(4)
            .cut();

        // Write to device (chunked if necessary, but invoice usually small)
        await characteristic.writeValue(encoder.getBuffer());

        device.gatt.disconnect();
        return true;

    } catch (error) {
        console.error("Bluetooth Print Error:", error);
        throw error;
    }
}
