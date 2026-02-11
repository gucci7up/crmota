import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight, Loader2, AlertTriangle, Clock } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts'

const data = [
    { name: 'Lun', sales: 4000 },
    { name: 'Mar', sales: 3000 },
    { name: 'Mie', sales: 2000 },
    { name: 'Jue', sales: 2780 },
    { name: 'Vie', sales: 1890 },
    { name: 'Sab', sales: 2390 },
    { name: 'Dom', sales: 3490 },
]

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="glass p-6 rounded-3xl border-slate-100 relative overflow-hidden group transition-all duration-300 hover:translate-y-[-4px]">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Icon size={80} className={color.replace('bg-', 'text-')} />
        </div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">{title}</p>
                <h3 className="text-3xl font-bold mt-2 text-slate-900">{value}</h3>
                {trend && (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mt-4 ${trend > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                        }`}>
                        {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}% vs mes pasado
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-2xl ${color} shadow-lg transition-transform duration-300 group-hover:rotate-6`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </div>
)

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalCredit: 0,
        totalProfit: 0,
        inventoryValue: 0,
        totalClients: 0,
        totalProducts: 0,
        lowStock: 0,
        loading: true
    })
    const [chartData, setChartData] = useState([])

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch stats in parallel
                const [salesRes, clientsRes, productsRes, lowStockRes, profitRes, invRes, cuotasRes] = await Promise.all([
                    supabase.from('ventas').select('total, metodo_pago'),
                    supabase.from('clientes').select('id', { count: 'exact' }),
                    supabase.from('productos').select('id', { count: 'exact' }),
                    supabase.from('productos').select('id', { count: 'exact' }).lt('stock', 10),
                    supabase.from('detalle_ventas').select('subtotal, cantidad, costo_unitario'),
                    supabase.from('productos').select('stock, precio_compra'),
                    supabase.from('cuotas').select('monto_pagado')
                ])

                // Calculate Cash Flow (Real Money) vs Credit (Pending)
                const cashSales = salesRes.data
                    ?.filter(s => s.metodo_pago !== 'cuotas' && s.metodo_pago !== 'credito')
                    .reduce((sum, sale) => sum + Number(sale.total || 0), 0) || 0

                // Add payments made on credit sales (Partial or Full)
                const collectedCredit = cuotasRes.data?.reduce((sum, cuota) => sum + Number(cuota.monto_pagado || 0), 0) || 0

                const totalCashOnHand = cashSales + collectedCredit

                const creditSales = salesRes.data
                    ?.filter(s => s.metodo_pago === 'cuotas' || s.metodo_pago === 'credito')
                    .reduce((sum, sale) => sum + Number(sale.total || 0), 0) || 0

                const totalSalesVolume = salesRes.data?.reduce((sum, sale) => sum + Number(sale.total || 0), 0) || 0

                const totalCostOfGoodsSold = profitRes.data?.reduce((sum, item) =>
                    sum + (Number(item.cantidad || 0) * Number(item.costo_unitario || 0)), 0) || 0

                const totalProfit = totalSalesVolume - totalCostOfGoodsSold

                const inventoryValue = invRes.data?.reduce((sum, prod) =>
                    sum + (Number(prod.stock || 0) * Number(prod.precio_compra || 0)), 0) || 0

                setStats({
                    totalSales: totalCashOnHand, // Real money in hand (Cash Sales + Collected Credit)
                    totalCredit: creditSales, // Total volume sold on credit
                    totalProfit,
                    inventoryValue,
                    totalClients: clientsRes.count || 0,
                    totalProducts: productsRes.count || 0,
                    lowStock: lowStockRes.count || 0,
                    loading: false
                })

                // Mock dynamic chart data for now based on last 7 days
                const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
                const mockChart = Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (6 - i))
                    return {
                        name: days[d.getDay()],
                        sales: Math.floor(Math.random() * 5000) + 1000
                    }
                })
                setChartData(mockChart)

            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            }
        }

        fetchDashboardData()
    }, [])

    if (stats.loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        )
    }
    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Panel de Control</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Resumen operativo en tiempo real</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 glass rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                        Hoy: 10 Feb 2026
                    </button>
                    <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95 text-white">
                        Exportar Reporte
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Dinero en Caja"
                    value={`$${stats.totalSales.toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-emerald-600"
                    trend={12}
                />
                <StatCard
                    title="Ventas a Crédito"
                    value={`$${stats.totalCredit.toLocaleString()}`}
                    icon={Clock}
                    color="bg-indigo-600"
                />
                <StatCard
                    title="Ganancia Bruta"
                    value={`$${stats.totalProfit.toLocaleString()}`}
                    icon={TrendingUp}
                    color="bg-blue-600"
                    trend={15}
                />
                <StatCard
                    title="Valor Inventario"
                    value={`$${stats.inventoryValue.toLocaleString()}`}
                    icon={Package}
                    color="bg-amber-500"
                />
                <StatCard
                    title="Bajo Stock"
                    value={stats.lowStock.toLocaleString()}
                    icon={AlertTriangle}
                    color="bg-rose-500"
                    trend={-2}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[2.5rem] border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Rendimiento de Ventas</h3>
                            <p className="text-sm text-slate-500">Distribución semanal de ingresos</p>
                        </div>
                    </div>
                    <div className="h-[22rem]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Top Productos</h3>
                            <p className="text-sm text-slate-500">Artículos más populares por volumen</p>
                        </div>
                    </div>
                    <div className="h-[22rem]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar
                                    dataKey="sales"
                                    fill="#8b5cf6"
                                    radius={[8, 8, 0, 0]}
                                    className="hover:fill-indigo-400 transition-colors"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
