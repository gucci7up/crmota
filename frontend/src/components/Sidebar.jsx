import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    FileText,
    Truck,
    Settings,
    LogOut,
    Bell,
    MessageSquare,
    Calendar
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
    const location = useLocation()
    const { signOut, profile } = useAuth()

    const menuItems = [
        { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { title: 'POS (Ventas)', icon: ShoppingCart, path: '/pos' },
        { title: 'CRM Clientes', icon: Users, path: '/clientes' },
        { title: 'Productos', icon: Package, path: '/productos' },
        { title: 'Facturas', icon: FileText, path: '/facturas' },
        { title: 'Proveedores', icon: Truck, path: '/proveedores' },
        { title: 'Notificaciones', icon: Bell, path: '/notificaciones' },
        { title: 'Cuentas x Cobrar', icon: Calendar, path: '/cuotas' },
        { title: 'WhatsApp', icon: MessageSquare, path: '/whatsapp' },
        { title: 'Configuración', icon: Settings, path: '/configuracion' },
    ]

    return (
        <div className="flex flex-col h-screen w-64 bg-white border-r border-slate-200 text-slate-900 shadow-sm relative z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20">
                    <span className="text-xl text-white">C</span>
                </div>
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">
                    CRMota
                </span>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="font-semibold">{item.title}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md">
                        {profile?.nombre?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate text-slate-900">{profile?.nombre || 'Usuario'}</p>
                        <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {profile?.rol || 'Vendedor'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300 font-medium"
                >
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    )
}

export default Sidebar
