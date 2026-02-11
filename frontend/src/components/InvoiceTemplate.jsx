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

    // Thermal CSS classes
    const isThermal = format === '80mm' || format === '58mm'
    const containerClass = isThermal
        ? `bg-white text-slate-900 font-mono text-sm ${format === '58mm' ? 'max-w-[58mm] p-2' : 'max-w-[80mm] p-4'} mx-auto print:max-w-none print:w-full print:p-0`
        : "bg-white p-10 max-w-4xl mx-auto text-slate-900 print:p-0 print:max-w-none"

    return (
        <div ref={ref} className={containerClass}>
            {/* Header */}
            <div className={`text-center mb-6 ${isThermal ? 'border-b border-dashed border-slate-900 pb-4' : 'flex justify-between items-start border-b border-slate-200 pb-8'}`}>
                <div className={isThermal ? '' : 'text-left'}>
                    <h1 className={`${isThermal ? 'text-xl' : 'text-3xl'} font-black text-indigo-900 uppercase tracking-tight mb-2`}>CRMota Store</h1>
                    {isThermal && <p className="text-xs font-bold uppercase">RUT: 76.123.456-7</p>}
                    <p className={`text-sm ${isThermal ? 'text-slate-900' : 'text-slate-500'}`}>Av. Principal 123, Santiago</p>
                    <p className={`text-sm ${isThermal ? 'text-slate-900' : 'text-slate-500'}`}>+56 9 1234 5678</p>
                </div>
                {!isThermal && (
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-900">FACTURA ELECTRÓNICA</h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">#{venta.id.toString().slice(0, 8)}</p>
                    </div>
                )}
            </div>

            {/* Thermal Info Header */}
            {isThermal && (
                <div className="mb-4 text-center border-b border-dashed border-slate-900 pb-4">
                    <p className="font-bold text-lg uppercase mb-1">VENTA #{venta.id.toString().slice(0, 8)}</p>
                    <p className="text-xs mb-2">{fecha}</p>
                    <p className={`font-black uppercase ${isCredito ? 'text-black' : 'text-black'}`}>
                        {isCredito ? 'VENTA A CRÉDITO' : 'VENTA CONTADO'}
                    </p>
                </div>
            )}

            {/* Info Grid (A4 Only) */}
            {!isThermal && (
                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Cliente</h3>
                        <div className="space-y-1">
                            <p className="font-bold text-lg text-slate-900">{venta.clientes?.nombre || 'Consumidor Final'}</p>
                            <p className="text-sm text-slate-600">{venta.clientes?.documento || 'Sin RUT'}</p>
                            <p className="text-sm text-slate-600">{venta.clientes?.email}</p>
                            <p className="text-sm text-slate-600">{venta.clientes?.telefono}</p>
                            <p className="text-sm text-slate-600">{venta.clientes?.direccion}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Detalles del Pedido</h3>
                        <div className="space-y-1">
                            <div className="flex justify-end gap-4">
                                <span className="text-slate-500 font-medium">Fecha:</span>
                                <span className="font-bold">{fecha}</span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span className="text-slate-500 font-medium">Método de Pago:</span>
                                <span className={`font-bold uppercase ${isCredito ? 'text-indigo-600' : 'text-emerald-600'}`}>
                                    {venta.metodo_pago}
                                </span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span className="text-slate-500 font-medium">Estado:</span>
                                <span className="font-bold uppercase">{venta.estado_pago}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Thermal Client Info */}
            {isThermal && (
                <div className="mb-4 text-xs">
                    <p><span className="font-bold">CLIENTE:</span> {venta.clientes?.nombre || 'Consumidor Final'}</p>
                    {venta.clientes?.documento && <p><span className="font-bold">RUT:</span> {venta.clientes?.documento}</p>}
                    {venta.clientes?.direccion && <p><span className="font-bold">DIR:</span> {venta.clientes?.direccion}</p>}
                </div>
            )}

            {/* Items Table */}
            <table className="w-full mb-6">
                <thead>
                    <tr className="border-b-2 border-slate-900">
                        <th className="py-2 text-left text-xs font-black uppercase tracking-widest text-slate-900">Desc.</th>
                        {!isThermal && <th className="py-2 text-right text-xs font-black uppercase tracking-widest text-slate-900">Cant.</th>}
                        <th className="py-2 text-right text-xs font-black uppercase tracking-widest text-slate-900">Total</th>
                    </tr>
                </thead>
                <tbody className={`${isThermal ? 'border-b border-dashed border-slate-900' : 'divide-y divide-slate-100'}`}>
                    {venta.detalle_ventas?.map((item, index) => (
                        <tr key={index}>
                            <td className="py-2">
                                <p className={`font-bold text-slate-900 ${isThermal ? 'text-xs' : ''}`}>{item.productos?.nombre || 'Producto eliminado'}</p>
                                {!isThermal && <p className="text-xs text-slate-400">{item.productos?.sku}</p>}
                                {isThermal && <p className="text-[10px] text-slate-500">{item.cantidad} x ${Number(item.precio_unitario).toLocaleString('es-CL')}</p>}
                            </td>
                            {!isThermal && <td className="py-2 text-right font-medium">{item.cantidad}</td>}
                            {!isThermal && <td className="py-2 text-right font-medium">${Number(item.precio_unitario).toLocaleString('es-CL')}</td>}
                            <td className="py-2 text-right font-bold text-slate-900 align-top">${Number(item.subtotal).toLocaleString('es-CL')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className={`flex justify-end ${isThermal ? 'mb-8' : ''}`}>
                <div className={`${isThermal ? 'w-full' : 'w-1/2'} space-y-2`}>
                    {!isThermal && (
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>${Number(venta.total).toLocaleString('es-CL')}</span>
                        </div>
                    )}
                    <div className={`flex justify-between ${isThermal ? 'text-xl border-none' : 'text-2xl pt-4 border-t-2 border-slate-900'} font-black text-slate-900`}>
                        <span>TOTAL</span>
                        <span>${Number(venta.total).toLocaleString('es-CL')}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={`mt-8 pt-8 ${isThermal ? 'border-t border-dashed border-slate-900' : 'border-t border-slate-200'} text-center text-slate-400 text-xs uppercase tracking-widest`}>
                <p className={isThermal ? 'text-slate-900 font-bold mb-2' : ''}>¡Gracias por su preferencia!</p>
                {!isThermal && <p className="mt-2 text-[10px]">Documento generado electrónicamente por CRMota</p>}
                {isThermal && <p className="text-[10px]">Copia Cliente</p>}
            </div>
        </div>
    )
})

export default InvoiceTemplate
