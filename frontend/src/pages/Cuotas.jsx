import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
    Clock,
    Calendar,
    User,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    DollarSign,
    Loader2,
    ArrowUpRight,
    TrendingDown,
    Receipt
} from 'lucide-react'

const Cuotas = () => {
    const { user } = useAuth()
    const [cuotas, setCuotas] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pendiente') // pendiente, pagado, vencido
    const [searchTerm, setSearchTerm] = useState('')
    const [stats, setStats] = useState({
        porCobrar: 0,
        vencido: 0,
        recuperado: 0
    })

    useEffect(() => {
        fetchCuotas()
    }, [filter])

    const fetchCuotas = async () => {
        setLoading(true)
        let query = supabase
            .from('cuotas')
            .select(`
                *,
                ventas (
                    id,
                    total,
                    clientes (
                        nombre,
                        telefono
                    )
                )
            `)
            .order('fecha_vencimiento', { ascending: true })

        if (filter !== 'all') {
            query = query.eq('estado', filter)
        }

        const { data, error } = await query

        if (!error) {
            setCuotas(data)
            calculateStats(data)
        }
        setLoading(false)
    }

    const calculateStats = (data) => {
        // En un caso real, esto se haría con un query de agregación
        // Pero para el demo, calculamos sobre el set actual
        const porCobrar = data.filter(c => c.estado === 'pendiente').reduce((acc, c) => acc + Number(c.monto), 0)
        const vencido = data.filter(c => c.estado === 'vencido').reduce((acc, c) => acc + Number(c.monto), 0)
        const recuperado = data.filter(c => c.estado === 'pagado').reduce((acc, c) => acc + Number(c.monto), 0)

        setStats({ porCobrar, vencido, recuperado })
    }

    const markAsPaid = async (cuota) => {
        const { error } = await supabase
            .from('cuotas')
            .update({ estado: 'pagado' })
            .eq('id', cuota.id)

        if (!error) {
            // Check if all cuotas for this sale are paid
            checkSaleCompletion(cuota.venta_id)
            fetchCuotas()
        }
    }

    const checkSaleCompletion = async (ventaId) => {
        const { data: allCuotas } = await supabase
            .from('cuotas')
            .select('estado')
            .eq('venta_id', ventaId)

        const allPaid = allCuotas.every(c => c.estado === 'pagado')
        if (allPaid) {
            await supabase
                .from('ventas')
                .update({ estado_pago: 'pagado' })
                .eq('id', ventaId)
        }
    }

    const filteredCuotas = cuotas.filter(c =>
        c.ventas?.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ventas?.id.includes(searchTerm)
    )

    const getStatusStyle = (estado) => {
        switch (estado) {
            case 'pagado': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            case 'vencido': return 'bg-rose-50 text-rose-600 border-rose-100'
            default: return 'bg-amber-50 text-amber-600 border-amber-100'
        }
    }

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

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o # venta..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative group">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <select
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold shadow-sm appearance-none cursor-pointer"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="pendiente">Pendientes</option>
                        <option value="vencido">Vencidos</option>
                        <option value="pagado">Pagados</option>
                        <option value="all">Todos los registros</option>
                    </select>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-6">Cliente / Venta</th>
                                <th className="px-8 py-6">Vencimiento</th>
                                <th className="px-8 py-6">Deuda Total</th>
                                <th className="px-8 py-6">Estado</th>
                                <th className="px-8 py-6 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                                        <Loader2 className="animate-spin inline-block mb-3" size={32} />
                                        <p className="font-bold">Cargando registros...</p>
                                    </td>
                                </tr>
                            ) : filteredCuotas.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-300">
                                        <p className="text-lg font-black italic">No se encontraron deudas para este filtro</p>
                                    </td>
                                </tr>
                            ) : filteredCuotas.map((cuota) => (
                                <tr key={cuota.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 shadow-sm transition-transform group-hover:scale-110">
                                                {cuota.ventas?.clientes?.nombre?.charAt(0) || 'C'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {cuota.ventas?.clientes?.nombre || 'Consumidor Final'}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">
                                                    Venta #{cuota.venta_id.slice(0, 8)}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="text-sm font-bold text-slate-600">
                                                {new Date(cuota.fecha_vencimiento).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-lg font-black text-slate-900">
                                            ${Number(cuota.monto).toLocaleString('es-CL')}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(cuota.estado)}`}>
                                            {cuota.estado}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {cuota.estado !== 'pagado' && (
                                            <button
                                                onClick={() => markAsPaid(cuota)}
                                                className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/10 transition-all font-bold text-xs flex items-center gap-2 ml-auto active:scale-95"
                                            >
                                                <DollarSign size={14} />
                                                Registrar Pago
                                            </button>
                                        )}
                                        {cuota.estado === 'pagado' && (
                                            <div className="flex items-center justify-end gap-2 text-emerald-500 font-black text-[10px] uppercase">
                                                <CheckCircle2 size={16} />
                                                Pagado
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Cuotas
