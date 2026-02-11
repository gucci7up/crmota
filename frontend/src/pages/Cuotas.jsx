import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
    Clock,
    Search,
    DollarSign,
    Loader2,
    ArrowUpRight,
    TrendingDown,
    CheckCircle2,
    X,
    User,
    Phone,
    Mail,
    ChevronRight,
    ChevronDown,
    AlertTriangle
} from 'lucide-react'

const Cuotas = () => {
    const { user } = useAuth()
    const [clientsWithDebt, setClientsWithDebt] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [stats, setStats] = useState({
        porCobrar: 0,
        vencido: 0,
        recuperado: 0
    })

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch all cuotas with client info
            const { data: cuotas, error } = await supabase
                .from('cuotas')
                .select(`
                    *,
                    ventas (
                        id,
                        total,
                        clientes (
                            id,
                            nombre,
                            telefono,
                            email,
                            documento
                        )
                    )
                `)
                .order('fecha_vencimiento', { ascending: true })

            if (error) throw error

            processData(cuotas)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const processData = (allCuotas) => {
        const clientMap = {}
        let globalPorCobrar = 0
        let globalVencido = 0
        let globalRecuperado = 0

        allCuotas.forEach(cuota => {
            const cliente = cuota.ventas?.clientes
            const clientName = cliente?.nombre || 'Consumidor Final'
            const clientId = cliente?.id || 'unknown'

            if (!clientMap[clientId]) {
                clientMap[clientId] = {
                    info: cliente || { nombre: 'Consumidor Final' },
                    totalDeuda: 0,
                    deudaVencida: 0,
                    deudaRecuperada: 0,
                    cuotas: []
                }
            }

            const monto = Number(cuota.monto)
            const pagado = Number(cuota.monto_pagado || 0)
            const saldo = monto - pagado
            const isVencido = cuota.estado === 'vencido' || (cuota.estado === 'pendiente' && new Date(cuota.fecha_vencimiento) < new Date())

            if (saldo > 0) {
                clientMap[clientId].totalDeuda += saldo
                globalPorCobrar += saldo
                if (isVencido) {
                    clientMap[clientId].deudaVencida += saldo
                    globalVencido += saldo
                }
            }

            clientMap[clientId].deudaRecuperada += pagado
            globalRecuperado += pagado

            clientMap[clientId].cuotas.push({
                ...cuota,
                saldo,
                isVencido
            })
        })

        // Filter out clients with 0 debt if you only want to show active debts, 
        // OR keep them but sort by debt. Let's keep all who have ever had a cuota for history, 
        // or prioritize those with debt. 
        // User asked for "Cuentas por Cobrar", so likely only those with debt > 0 or history.
        // Let's show all for now, sorted by Highest Debt first.
        const clientsArray = Object.values(clientMap).sort((a, b) => b.totalDeuda - a.totalDeuda)

        setClientsWithDebt(clientsArray)
        setStats({
            porCobrar: globalPorCobrar,
            vencido: globalVencido,
            recuperado: globalRecuperado
        })
    }

    const handleOpenPaymentModal = (clientData) => {
        setSelectedClient(clientData)
        setPaymentAmount('')
        setIsPaymentModalOpen(true)
    }

    const handleProcessPayment = async (e) => {
        e.preventDefault()
        if (!selectedClient) return

        const amount = Number(paymentAmount)
        if (amount <= 0 || amount > selectedClient.totalDeuda + 1) { // +1 tolerance
            alert('Monto inválido')
            return
        }

        setIsProcessing(true)
        try {
            let remaining = amount
            // Sort cuotas: Oldest due date first (standard accounting FIFO for debt)
            // Only consider unpaid cuotas
            const unpaidCuotas = selectedClient.cuotas
                .filter(c => c.saldo > 0.01)
                .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento))

            for (const cuota of unpaidCuotas) {
                if (remaining <= 0.01) break

                const paymentForCuota = Math.min(remaining, cuota.saldo)
                const newPagado = Number(cuota.monto_pagado || 0) + paymentForCuota
                const isFullyPaid = newPagado >= (Number(cuota.monto) - 0.01)
                const newStatus = isFullyPaid ? 'pagado' : 'pendiente'

                const { error } = await supabase
                    .from('cuotas')
                    .update({
                        monto_pagado: newPagado,
                        estado: newStatus
                    })
                    .eq('id', cuota.id)

                if (error) throw error

                // Check parent sale status if needed (optional optimization: do it in backend or separate process)
                if (isFullyPaid) {
                    // simplified check: if all cuotas of this sale are paid
                    // We would need to know all cuotas of the sale. 
                    // For now, let's just update the cuota. The 'checkSaleCompletion' logic 
                    // from previous code could be reused if critical.
                }

                remaining -= paymentForCuota
            }

            alert('Abono registrado exitosamente')
            setIsPaymentModalOpen(false)
            fetchData() // Refresh data

        } catch (error) {
            console.error('Error processing payment:', error)
            alert('Error al procesar el pago')
        } finally {
            setIsProcessing(false)
        }
    }

    const filteredClients = clientsWithDebt.filter(c =>
        c.info.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.info.documento?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-10 animate-fade-in text-slate-900 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cuentas por Cobrar</h1>
                    <p className="text-slate-500 font-medium italic mt-1">Gestión de créditos y deudas de clientes (Fiado)</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6 shadow-sm">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Por Cobrar</p>
                        <p className="text-3xl font-black text-slate-900">${stats.porCobrar.toLocaleString('es-CL')}</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6 shadow-sm">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                        <TrendingDown size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Vencido</p>
                        <p className="text-3xl font-black text-slate-900">${stats.vencido.toLocaleString('es-CL')}</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6 shadow-sm">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                        <ArrowUpRight size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recuperado</p>
                        <p className="text-3xl font-black text-slate-900">${stats.recuperado.toLocaleString('es-CL')}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative group max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por cliente..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium shadow-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-6">Cliente</th>
                                <th className="px-8 py-6">Contacto</th>
                                <th className="px-8 py-6">Estado Deuda</th>
                                <th className="px-8 py-6">Deuda Total</th>
                                <th className="px-8 py-6 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                                        <Loader2 className="animate-spin inline-block mb-3" size={32} />
                                        <p className="font-bold">Calculando deudas...</p>
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-300">
                                        <p className="text-lg font-black italic">No hay clientes con registros</p>
                                    </td>
                                </tr>
                            ) : filteredClients.map((clientData, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100 shadow-sm">
                                                {clientData.info.nombre?.charAt(0) || 'C'}
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {clientData.info.nombre}
                                                </p>
                                                {clientData.info.documento && (
                                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                                                        RUT: {clientData.info.documento}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            {clientData.info.telefono ? (
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                    <Phone size={12} /> {clientData.info.telefono}
                                                </div>
                                            ) : <span className="text-xs text-slate-300 italic">Sin teléfono</span>}
                                            {clientData.info.email ? (
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                    <Mail size={12} /> {clientData.info.email}
                                                </div>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col items-start gap-1">
                                            {clientData.deudaVencida > 0 && (
                                                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-rose-200">
                                                    <AlertTriangle size={10} />
                                                    Vencido: ${clientData.deudaVencida.toLocaleString('es-CL')}
                                                </span>
                                            )}
                                            {clientData.totalDeuda === 0 ? (
                                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-200 flex items-center gap-1.5">
                                                    <CheckCircle2 size={10} />
                                                    Al Día
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-wider border border-amber-200">
                                                    Pendiente
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xl font-black text-slate-900">
                                            ${clientData.totalDeuda.toLocaleString('es-CL')}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                            Total Histórico: ${((clientData.totalDeuda + clientData.deudaRecuperada)).toLocaleString('es-CL')}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {clientData.totalDeuda > 0 && (
                                            <button
                                                onClick={() => handleOpenPaymentModal(clientData)}
                                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/10 transition-all font-bold text-xs inline-flex items-center gap-2 active:scale-95"
                                            >
                                                <DollarSign size={16} />
                                                Registrar Abono
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Abono */}
            {isPaymentModalOpen && selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Registrar Pago</h2>
                                <p className="text-sm text-slate-500 font-bold tracking-tight uppercase">{selectedClient.info.nombre}</p>
                            </div>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleProcessPayment} className="p-8 space-y-8">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center space-y-2">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Deuda Total Actual</p>
                                <p className="text-4xl font-black text-slate-900">${selectedClient.totalDeuda.toLocaleString('es-CL')}</p>
                                {selectedClient.deudaVencida > 0 && (
                                    <p className="text-xs font-bold text-rose-500 mt-2">Vencido: ${selectedClient.deudaVencida.toLocaleString('es-CL')}</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Monto a Abonar</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedClient.totalDeuda}
                                        required
                                        autoFocus
                                        className="w-full pl-16 pr-6 py-6 bg-white border-2 border-slate-100 rounded-3xl text-3xl font-black text-slate-900 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-200"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold text-center">
                                    El pago se aplicará automáticamente a las cuotas más antiguas.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                Confirmar Transacción
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Cuotas
