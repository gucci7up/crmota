import React, { forwardRef } from 'react'
import { Building2, Phone, Mail, MapPin } from 'lucide-react'

const InvoiceTemplate = forwardRef(({ venta, format = 'a4' }, ref) => {
    if (!venta) return null

    const fecha = new Date(venta.created_at).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const isCredito = venta.metodo_pago === 'cuotas'
    const isThermal = format === '80mm' || format === '58mm'

    // Safe HEX colors for html2canvas compatibility (Tailwind 4 uses oklch which fails)
    const colors = {
        white: '#ffffff',
        slate50: '#f8fafc',
        slate100: '#f1f5f9',
        slate200: '#e2e8f0',
        slate400: '#94a3b8',
        slate500: '#64748b',
        slate900: '#0f172a',
        indigo600: '#4f46e5',
        indigo900: '#312e81',
        emerald600: '#059669',
        borderDashed: '1px dashed #0f172a',
        borderSolid: '1px solid #e2e8f0'
    }

    const containerStyle = isThermal
        ? { backgroundColor: colors.white, color: colors.slate900, fontFamily: 'monospace', fontSize: '14px', maxWidth: format === '58mm' ? '58mm' : '80mm', padding: format === '58mm' ? '8px' : '16px', margin: '0 auto' }
        : { backgroundColor: colors.white, padding: '40px', maxWidth: '896px', margin: '0 auto', color: colors.slate900 }

    return (
        <div ref={ref} style={containerStyle}>
            {/* Header */}
            <div style={{
                textAlign: 'center',
                marginBottom: '24px',
                borderBottom: isThermal ? colors.borderDashed : `1px solid ${colors.slate200}`,
                paddingBottom: isThermal ? '16px' : '32px',
                display: isThermal ? 'block' : 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <div style={{ textAlign: isThermal ? 'center' : 'left' }}>
                    <h1 style={{
                        fontSize: isThermal ? '20px' : '30px',
                        fontWeight: 900,
                        color: colors.indigo900,
                        textTransform: 'uppercase',
                        letterSpacing: '-0.025em',
                        marginBottom: '8px',
                        lineHeight: 1
                    }}>CRMota Store</h1>
                    {isThermal && <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: colors.slate900 }}>RUT: 76.123.456-7</p>}
                    <p style={{ fontSize: '14px', color: isThermal ? colors.slate900 : colors.slate500, margin: 0 }}>Av. Principal 123, Santiago</p>
                    <p style={{ fontSize: '14px', color: isThermal ? colors.slate900 : colors.slate500, margin: 0 }}>+56 9 1234 5678</p>
                </div>
                {!isThermal && (
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.slate900, margin: 0 }}>FACTURA ELECTRÓNICA</h2>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>#{venta.id.toString().slice(0, 8)}</p>
                    </div>
                )}
            </div>

            {/* Thermal Info Header */}
            {isThermal && (
                <div style={{ marginBottom: '16px', textAlign: 'center', borderBottom: colors.borderDashed, paddingBottom: '16px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '18px', textTransform: 'uppercase', marginBottom: '4px', margin: 0 }}>VENTA #{venta.id.toString().slice(0, 8)}</p>
                    <p style={{ fontSize: '12px', marginBottom: '8px', margin: 0 }}>{fecha}</p>
                    <p style={{ fontWeight: 900, textTransform: 'uppercase', color: colors.slate900, margin: 0 }}>
                        {isCredito ? 'VENTA A CRÉDITO' : 'VENTA CONTADO'}
                    </p>
                </div>
            )}

            {/* Info Grid (A4 Only) */}
            {!isThermal && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '48px' }}>
                    <div>
                        <h3 style={{ fontSize: '12px', fontWeight: 900, color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Cliente</h3>
                        <div style={{ lineHeight: 1.5 }}>
                            <p style={{ fontWeight: 'bold', fontSize: '18px', color: colors.slate900, margin: 0 }}>{venta.clientes?.nombre || 'Consumidor Final'}</p>
                            <p style={{ fontSize: '14px', color: colors.slate500, margin: 0 }}>{venta.clientes?.documento || 'Sin RUT'}</p>
                            <p style={{ fontSize: '14px', color: colors.slate500, margin: 0 }}>{venta.clientes?.email}</p>
                            <p style={{ fontSize: '14px', color: colors.slate500, margin: 0 }}>{venta.clientes?.telefono}</p>
                            <p style={{ fontSize: '14px', color: colors.slate500, margin: 0 }}>{venta.clientes?.direccion}</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 900, color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Detalles del Pedido</h3>
                        <div style={{ lineHeight: 1.6 }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <span style={{ color: colors.slate500, fontWeight: 500 }}>Fecha:</span>
                                <span style={{ fontWeight: 'bold', color: colors.slate900 }}>{fecha}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <span style={{ color: colors.slate500, fontWeight: 500 }}>Método de Pago:</span>
                                <span style={{ fontWeight: 'bold', textTransform: 'uppercase', color: isCredito ? colors.indigo600 : colors.emerald600 }}>
                                    {venta.metodo_pago}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <span style={{ color: colors.slate500, fontWeight: 500 }}>Estado:</span>
                                <span style={{ fontWeight: 'bold', textTransform: 'uppercase', color: colors.slate900 }}>{venta.estado_pago}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Thermal Client Info */}
            {isThermal && (
                <div style={{ marginBottom: '16px', fontSize: '12px' }}>
                    <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>CLIENTE:</span> {venta.clientes?.nombre || 'Consumidor Final'}</p>
                    {venta.clientes?.documento && <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>RUT:</span> {venta.clientes?.documento}</p>}
                    {venta.clientes?.direccion && <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>DIR:</span> {venta.clientes?.direccion}</p>}
                </div>
            )}

            {/* Items Table */}
            <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: `2px solid ${colors.slate900}` }}>
                        <th style={{ padding: '8px 0', textAlign: 'left', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.slate900 }}>Desc.</th>
                        {!isThermal && <th style={{ padding: '8px 0', textAlign: 'right', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.slate900 }}>Cant.</th>}
                        <th style={{ padding: '8px 0', textAlign: 'right', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.slate900 }}>Total</th>
                    </tr>
                </thead>
                <tbody style={{ borderBottom: isThermal ? colors.borderDashed : `1px solid ${colors.slate100}` }}>
                    {venta.detalle_ventas?.map((item, index) => (
                        <tr key={index} style={{ borderBottom: isThermal ? 'none' : `1px solid ${colors.slate100}` }}>
                            <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                                <p style={{ fontWeight: 'bold', color: colors.slate900, fontSize: isThermal ? '12px' : '14px', margin: 0 }}>{item.productos?.nombre || 'Producto eliminado'}</p>
                                {!isThermal && <p style={{ fontSize: '12px', color: colors.slate400, margin: 0 }}>{item.productos?.sku}</p>}
                                {isThermal && <p style={{ fontSize: '10px', color: colors.slate500, margin: 0 }}>{item.cantidad} x ${Number(item.precio_unitario).toLocaleString('es-CL')}</p>}
                            </td>
                            {!isThermal && <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500, color: colors.slate900 }}>{item.cantidad}</td>}
                            {!isThermal && <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500, color: colors.slate900 }}>${Number(item.precio_unitario).toLocaleString('es-CL')}</td>}
                            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: colors.slate900, verticalAlign: 'top' }}>${Number(item.subtotal).toLocaleString('es-CL')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: isThermal ? '32px' : '0' }}>
                <div style={{ width: isThermal ? '100%' : '50%' }}>
                    {!isThermal && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.slate500, marginBottom: '8px' }}>
                            <span>Subtotal</span>
                            <span>${Number(venta.total).toLocaleString('es-CL')}</span>
                        </div>
                    )}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: isThermal ? '20px' : '24px',
                        paddingTop: isThermal ? '0' : '16px',
                        borderTop: isThermal ? 'none' : `2px solid ${colors.slate900}`,
                        fontWeight: 900,
                        color: colors.slate900
                    }}>
                        <span>TOTAL</span>
                        <span>${Number(venta.total).toLocaleString('es-CL')}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                marginTop: '32px',
                paddingTop: '32px',
                borderTop: isThermal ? colors.borderDashed : `1px solid ${colors.slate200}`,
                textAlign: 'center',
                color: isThermal ? colors.slate900 : colors.slate400,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            }}>
                <p style={{ fontWeight: isThermal ? 'bold' : 'normal', marginBottom: '8px', margin: 0 }}>¡Gracias por su preferencia!</p>
                {!isThermal && <p style={{ marginTop: '8px', fontSize: '10px', margin: 0 }}>Documento generado electrónicamente por CRMota</p>}
                {isThermal && <p style={{ fontSize: '10px', margin: 0 }}>Copia Cliente</p>}
            </div>
        </div>
    )
})

export default InvoiceTemplate
