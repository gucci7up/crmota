import React, { forwardRef } from 'react'

const InvoiceTemplate = forwardRef(({ venta }, ref) => {
    if (!venta) return null

    const fecha = new Date(venta.created_at).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const isCredito = venta.metodo_pago === 'cuotas'

    return (
        <div ref={ref} className="bg-white p-10 max-w-4xl mx-auto text-slate-900 print:p-0 print:max-w-none">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-indigo-900 uppercase tracking-tight mb-2">FACTURA DE VENTA</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">#{venta.id.toString().slice(0, 8)}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-900">CRMota Store</h2>
                    <p className="text-sm text-slate-500">Av. Principal 123, Santiago</p>
                    <p className="text-sm text-slate-500">contacto@crmota.com</p>
                    <p className="text-sm text-slate-500">+56 9 1234 5678</p>
                </div>
            </div>

            {/* Info Grid */}
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

            {/* Items Table */}
            <table className="w-full mb-12">
                <thead>
                    <tr className="border-b-2 border-slate-900">
                        <th className="py-3 text-left text-xs font-black uppercase tracking-widest text-slate-900">Producto</th>
                        <th className="py-3 text-right text-xs font-black uppercase tracking-widest text-slate-900">Cant.</th>
                        <th className="py-3 text-right text-xs font-black uppercase tracking-widest text-slate-900">Precio Unit.</th>
                        <th className="py-3 text-right text-xs font-black uppercase tracking-widest text-slate-900">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {venta.detalle_ventas?.map((item, index) => (
                        <tr key={index}>
                            <td className="py-4">
                                <p className="font-bold text-slate-900">{item.productos?.nombre || 'Producto eliminado'}</p>
                                <p className="text-xs text-slate-400">{item.productos?.sku}</p>
                            </td>
                            <td className="py-4 text-right font-medium">{item.cantidad}</td>
                            <td className="py-4 text-right font-medium">${Number(item.precio_unitario).toLocaleString('es-CL')}</td>
                            <td className="py-4 text-right font-bold text-slate-900">${Number(item.subtotal).toLocaleString('es-CL')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
                <div className="w-1/2 space-y-3">
                    <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span>${Number(venta.total).toLocaleString('es-CL')}</span>
                    </div>
                    {/* Add Tax/Discount logic here if needed */}
                    <div className="flex justify-between text-2xl font-black text-slate-900 pt-4 border-t-2 border-slate-900">
                        <span>TOTAL</span>
                        <span>${Number(venta.total).toLocaleString('es-CL')}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs uppercase tracking-widest">
                <p>Gracias por su preferencia</p>
                <p className="mt-2 text-[10px]">Documento generado electrónicamente por CRMota</p>
            </div>
        </div>
    )
})

export default InvoiceTemplate
