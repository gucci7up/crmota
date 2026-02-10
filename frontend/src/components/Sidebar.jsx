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
    MessageSquare
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
        { title: 'WhatsApp', icon: MessageSquare, path: '/whatsapp' },
    ]

    return (
        <div className="flex flex-col h-screen w-64 bg-slate-900 text-white border-r border-slate-800">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold">C</div>
                <span className="text-xl font-bold tracking-tight">CRMota</span>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.title}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                        {/* User Avatar */}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{profile?.nombre || 'Usuario'}</p>
                        <p className="text-xs text-slate-500 capitalize">{profile?.rol || 'Vendedor'}</p>
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    )
}

export default Sidebar
