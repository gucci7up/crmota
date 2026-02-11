import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, Search, Download, Filter, Eye, Tag, Loader2, Printer, X, CreditCard, Banknote, Bluetooth } from 'lucide-react'
import InvoiceTemplate from '../components/InvoiceTemplate'
import PrintPreviewModal from '../components/PrintPreviewModal'

const Facturas = () => {
    const [ventas, setVentas] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        todayCount: 0,
        todayTotal: 0,
        pending: 0
    })

    // Invoice Modal State
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
    const [printerFormat, setPrinterFormat] = useState('a4')
    const invoiceRef = useRef(null)

    useEffect(() => {
        fetchSales()
        // Load printer preference
        const savedFormat = localStorage.getItem('printerFormat')
        if (savedFormat) setPrinterFormat(savedFormat)
    }, [])

    const fetchSales = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('ventas')
            .select(`
                *,
                clientes (nombre, documento, direccion, telefono, email),
                detalle_ventas (
                    cantidad,
                    precio_unitario,
                    subtotal,
                    productos (nombre, sku)
                )
            `)
            .order('created_at', { ascending: false })

        if (!error) {
            setVentas(data)

            // Calculate basic stats for today
            const today = new Date().toISOString().split('T')[0]
            const todaySales = data.filter(v => v.created_at.startsWith(today))
            setStats({
                todayCount: todaySales.length,
                todayTotal: todaySales.reduce((acc, v) => acc + Number(v.total), 0),
                pending: data.filter(v => v.estado_pago === 'pendiente').length
            })
        }
        setLoading(false)
    }



    const openInvoiceModal = (venta) => {
        setSelectedInvoice(venta)
        setIsInvoiceModalOpen(true)
    }

    const filteredVentas = ventas.filter(v =>
        v.id.toString().includes(searchTerm) ||
        v.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-10 animate-fade-in text-slate-900">
            {/* Screen Content - Hidden when printing */}
            <div className="print:hidden space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Facturación</h1>
                        <p className="text-slate-500 font-medium italic mt-1">Historial de ventas y reportes tributarios</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-5 transition-all hover:translate-y-[-4px] shadow-sm">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
                            <FileText size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ventas Hoy</p>
                            <p className="text-2xl font-black text-slate-900">{stats.todayCount}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-5 transition-all hover:translate-y-[-4px] shadow-sm">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
                            <Tag size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Hoy</p>
                            <p className="text-2xl font-black text-slate-900">${stats.todayTotal.toLocaleString('es-CL')}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-5 transition-all hover:translate-y-[-4px] shadow-sm">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-sm">
                            <Filter size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pendientes (Crédito)</p>
                            <p className="text-2xl font-black text-purple-600 font-black">{stats.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-6 justify-between items-center">
                        <div className="relative w-full max-w-xl group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por ID de venta o cliente..."
                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6">Factura #</th>
                                    <th className="px-8 py-6">Cliente</th>
                                    <th className="px-8 py-6">Fecha Emisión</th>
                                    <th className="px-8 py-6">Método Pago</th>
                                    <th className="px-8 py-6">Monto Total</th>
                                    <th className="px-8 py-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center">
                                            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
                                        </td>
                                    </tr>
                                ) : filteredVentas.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center text-slate-500 italic">
                                            No se encontraron ventas registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVentas.map(venta => (
                                        <tr key={venta.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-slate-900 tracking-widest uppercase">VENTA-{venta.id.toString().slice(0, 8)}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-slate-800 uppercase">{venta.clientes?.nombre || 'Consumidor Final'}</p>
                                            </td>
                                            <td className="px-8 py-6 text-sm text-slate-400 font-bold">
                                                {new Date(venta.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-8 py-6">
                                                {venta.metodo_pago === 'cuotas' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        <CreditCard size={12} /> Fiado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        <Banknote size={12} /> Contado
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black text-indigo-600">${Number(venta.total).toLocaleString('es-CL')}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openInvoiceModal(venta)}
                                                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                                                        title="Ver Detalle / Imprimir"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Print Preview Modal */}
            <PrintPreviewModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                invoice={selectedInvoice}
                format={printerFormat}
            />
        </div>
    )
}

export default Facturas
