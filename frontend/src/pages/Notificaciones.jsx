import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
    Bell,
    Package,
    ShoppingCart,
    Info,
    CheckCircle2,
    Clock,
    Trash2,
    AlertTriangle,
    Loader2,
    Search,
    Filter
} from 'lucide-react'

const Notificaciones = () => {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [stockAlerts, setStockAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, stock, system, orders
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (user) {
            fetchAll()
        }
    }, [user])

    const fetchAll = async () => {
        setLoading(true)
        await Promise.all([
            fetchDbNotifications(),
            fetchStockAlerts()
        ])
        setLoading(false)
    }

    const fetchDbNotifications = async () => {
        const { data, error } = await supabase
            .from('notificaciones')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (!error) setNotifications(data || [])
    }

    const fetchStockAlerts = async () => {
        const { data, error } = await supabase
            .from('productos')
            .select('id, nombre, stock, stock_min')
            .lt('stock', supabase.rpc('get_stock_min_ref', { id_val: 'stock_min' })) // This is a bit complex for simple query, let's just fetch and filter

        // Simpler for now: fetch products where stock < stock_min
        const { data: prods, error: err } = await supabase
            .from('productos')
            .select('*')

        if (!err) {
            const alerts = prods
                .filter(p => p.stock < p.stock_min)
                .map(p => ({
                    id: `stock-${p.id}`,
                    tipo: 'stock',
                    titulo: 'Stock Crítico',
                    mensaje: `El producto "${p.nombre}" tiene solo ${p.stock} unidades (Mínimo: ${p.stock_min})`,
                    created_at: new Date().toISOString(),
                    leido: false,
                    meta: { productId: p.id }
                }))
            setStockAlerts(alerts)
        }
    }

    const markAsRead = async (id) => {
        if (id.startsWith('stock-')) return // Virtual alerts can't be marked in DB yet

        const { error } = await supabase
            .from('notificaciones')
            .update({ leido: true })
            .eq('id', id)

        if (!error) {
            setNotifications(notifications.map(n => n.id === id ? { ...n, leido: true } : n))
        }
    }

    const deleteNotification = async (id) => {
        if (id.startsWith('stock-')) return

        const { error } = await supabase
            .from('notificaciones')
            .delete()
            .eq('id', id)

        if (!error) {
            setNotifications(notifications.filter(n => n.id !== id))
        }
    }

    const combined = [...notifications, ...stockAlerts]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .filter(n => {
            if (filter === 'all') return true
            return n.tipo === filter
        })
        .filter(n =>
            n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.mensaje.toLowerCase().includes(searchTerm.toLowerCase())
        )

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'stock': return <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shadow-sm"><AlertTriangle size={20} /></div>
            case 'venta': return <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm"><ShoppingCart size={20} /></div>
            case 'sistema': return <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm"><Info size={20} /></div>
            default: return <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 shadow-sm"><Bell size={20} /></div>
        }
    }

    return (
        <div className="space-y-10 animate-fade-in text-slate-900 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Centro de Notificaciones</h1>
                    <p className="text-slate-500 font-medium italic mt-1">Mantente al tanto de ventas, inventario y alertas del sistema</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchAll}
                        className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-2xl transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
                    >
                        <Clock size={18} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 h-fit relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar en notificaciones..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 transition-all font-medium shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative group">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <select
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 transition-all font-bold shadow-sm appearance-none cursor-pointer"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">Todas</option>
                        <option value="stock">Alertas Stock</option>
                        <option value="venta">Ventas</option>
                        <option value="sistema">Sistema</option>
                    </select>
                </div>
            </div>

            {/* Lista de Notificaciones */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                        <Loader2 className="animate-spin mb-4" size={48} />
                        <p className="font-bold text-lg">Sincronizando alertas...</p>
                    </div>
                ) : combined.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-300">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Bell size={48} className="opacity-10" />
                        </div>
                        <p className="text-xl font-black text-slate-400">No hay notificaciones pendientes</p>
                        <p className="text-sm font-medium">Todo está en orden por ahora</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {combined.map((n) => (
                            <div
                                key={n.id}
                                className={`p-8 hover:bg-slate-50/50 transition-colors flex gap-6 items-start group ${n.leido ? 'opacity-60' : ''}`}
                            >
                                {getIcon(n.tipo)}

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className={`text-lg font-black ${n.leido ? 'text-slate-600' : 'text-slate-900'}`}>
                                                {n.titulo}
                                            </h3>
                                            <p className="text-slate-500 font-medium mt-1 leading-relaxed">
                                                {n.mensaje}
                                            </p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                                                {new Date(n.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>

                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!n.leido && !n.id.toString().startsWith('stock-') && (
                                                    <button
                                                        onClick={() => markAsRead(n.id)}
                                                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 rounded-xl transition-all shadow-sm"
                                                        title="Marcar como leída"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}
                                                {!n.id.toString().startsWith('stock-') && (
                                                    <button
                                                        onClick={() => deleteNotification(n.id)}
                                                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Notificaciones
