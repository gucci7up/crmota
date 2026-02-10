import React, { useState } from 'react'
import { Plus, Search, Package, AlertTriangle, ArrowUpDown } from 'lucide-react'

const Productos = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white text-slate-900">Inventario de Productos</h1>
                    <p className="text-slate-500 dark:text-slate-400">Controla tu stock y categorías de productos.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                        Categorías
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-colors">
                        <Plus size={20} />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-primary-500/10 text-primary-500 rounded-xl">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Productos</p>
                        <p className="text-2xl font-bold dark:text-white text-slate-900">1,240</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Stock Bajo</p>
                        <p className="text-2xl font-bold dark:text-white text-slate-900">12</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                        <ArrowUpDown size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Categorías</p>
                        <p className="text-2xl font-bold dark:text-white text-slate-900">8</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {/* Table content similar to clientes but with stock columns */}
                <div className="p-8 text-center text-slate-400">
                    Tabla de productos lista para conectar con Supabase...
                </div>
            </div>
        </div>
    )
}

export default Productos
