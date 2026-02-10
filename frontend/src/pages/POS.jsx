import React, { useState } from 'react'
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, DollarSign, Package } from 'lucide-react'

const POS = () => {
    const [cart, setCart] = useState([])
    const [searchTerm, setSearchTerm] = useState('')

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item => item.id === product.id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
                )
            }
            return [...prev, { ...product, cantidad: 1 }]
        })
    }

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, item.cantidad + delta)
                return { ...item, cantidad: newQty }
            }
            return item
        }))
    }

    const subtotal = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)
    const tax = subtotal * 0.16
    const total = subtotal + tax

    // Mock Products
    const products = [
        { id: '1', nombre: 'iPhone 15 Pro', precio: 999.00, categoria: 'Celulares', sku: 'IP15-P' },
        { id: '2', nombre: 'MacBook Air M2', precio: 1199.00, categoria: 'Laptops', sku: 'MBA-M2' },
        { id: '3', nombre: 'AirPods Pro 2', precio: 249.00, categoria: 'Audio', sku: 'APP-2' },
        { id: '4', nombre: 'Samsung S24 Ultra', precio: 1299.00, categoria: 'Celulares', sku: 'S24-U' },
        { id: '5', nombre: 'Monitor Dell 27"', precio: 299.00, categoria: 'Periféricos', sku: 'DELL-27' },
        { id: '6', nombre: 'Teclado Mecánico', precio: 120.00, categoria: 'Periféricos', sku: 'KBD-M' },
    ].filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <div className="h-full flex gap-8">
            <div className="flex-1 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold dark:text-white text-slate-900">Punto de Venta</h1>
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o SKU..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map(product => (
                        <div
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow cursor-pointer group"
                        >
                            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 flex items-center justify-center text-slate-400">
                                <Package size={32} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <p className="text-xs text-primary-500 font-bold uppercase tracking-wider">{product.categoria}</p>
                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{product.nombre}</h3>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-lg font-black text-slate-900 dark:text-white">${product.precio.toFixed(2)}</span>
                                <button className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-96 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="text-primary-500" />
                        <h2 className="text-xl font-bold dark:text-white">Carrito</h2>
                        <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-1 rounded-full">{cart.reduce((a, b) => a + b.cantidad, 0)} items</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <ShoppingCart size={48} className="mb-4 opacity-20" />
                            <p>Tu carrito está vacío</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 items-center">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.nombre}</p>
                                    <p className="text-xs text-slate-500">${item.precio.toFixed(2)} c/u</p>
                                </div>
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1) }} className="p-1 text-slate-500 hover:text-primary-500"><Minus size={14} /></button>
                                    <span className="w-8 text-center text-sm font-bold dark:text-white">{item.cantidad}</span>
                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1) }} className="p-1 text-slate-500 hover:text-primary-500"><Plus size={14} /></button>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id) }} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>IVA (16%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-4">
                            <span>TOTAL</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                            <DollarSign size={16} className="text-emerald-500 mb-1" />
                            <span className="text-[10px] font-bold">Efectivo</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                            <CreditCard size={16} className="text-blue-500 mb-1" />
                            <span className="text-[10px] font-bold">Tarjeta</span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Plus size={16} className="mb-1" />
                            <span className="text-[10px] font-bold">Otro</span>
                        </div>
                    </div>

                    <button
                        disabled={cart.length === 0}
                        className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98]"
                    >
                        CONFIRMAR VENTA
                    </button>
                </div>
            </div>
        </div>
    )
}

export default POS
