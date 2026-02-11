import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, DollarSign, Package, Tag, Loader2, CheckCircle2, Calendar } from 'lucide-react'

const POS = () => {
    const { user } = useAuth()
    const [products, setProducts] = useState([])
    const [cart, setCart] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [checkoutStatus, setCheckoutStatus] = useState(null)
    const [clients, setClients] = useState([])
    const [selectedClient, setSelectedClient] = useState(null)
    const [isCuotasModalOpen, setIsCuotasModalOpen] = useState(false)
    const [numCuotas, setNumCuotas] = useState(3)
    const [cuotasData, setCuotasData] = useState([])

    useEffect(() => {
        fetchProducts()
        fetchClients()
    }, [])

    const fetchClients = async () => {
        const { data, error } = await supabase
            .from('clientes')
            .select('id, nombre, telefono')
            .order('nombre')
        if (!error) setClients(data)
    }

    const fetchProducts = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .order('nombre', { ascending: true })

        if (!error) setProducts(data)
        setLoading(false)
    }

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

    const generateCuotas = () => {
        if (!selectedClient) {
            alert('Debe seleccionar un cliente para ventas a cuotas')
            return
        }

        const cuotaMonto = total / numCuotas
        const generated = []
        for (let i = 1; i <= numCuotas; i++) {
            const date = new Date()
            date.setMonth(date.getMonth() + i)
            generated.push({
                monto: cuotaMonto,
                fecha_vencimiento: date.toISOString().split('T')[0]
            })
        }
        setCuotasData(generated)
        setIsCuotasModalOpen(true)
    }

    const handleCheckout = async (metodoPago = 'efectivo', finalCuotas = null) => {
        if (cart.length === 0) return
        if (metodoPago === 'cuotas' && !selectedClient) {
            alert('Venta a cuotas requiere seleccionar un cliente')
            return
        }

        setIsCheckingOut(true)
        setCheckoutStatus(null)

        try {
            const saleData = {
                usuario_id: user?.id,
                total: total,
                metodo_pago: metodoPago,
                items: cart,
                cliente_id: selectedClient?.id || null,
                cliente_nombre: selectedClient?.nombre || 'Consumidor Final',
                cliente_telefono: selectedClient?.telefono || null,
                cuotas: finalCuotas
            }

            const response = await fetch('/api/ventas/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            })

            const result = await response.json()

            if (result.status === 'success') {
                setCheckoutStatus('success')
                setCart([])
                setSelectedClient(null)
                setIsCuotasModalOpen(false)
                fetchProducts()
                setTimeout(() => setCheckoutStatus(null), 3000)
            } else {
                throw new Error(result.error || 'Error al procesar venta')
            }
        } catch (error) {
            console.error('Error en checkout:', error)
            alert(error.message)
            setCheckoutStatus('error')
        } finally {
            setIsCheckingOut(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="h-[calc(100vh-120px)] flex gap-8 animate-fade-in text-slate-900">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Punto de Venta</h1>
                        <p className="text-slate-500 font-medium">Selecciona productos para la venta</p>
                    </div>
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o SKU..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 scrollbar-elegant">
                    {loading ? (
                        <div className="col-span-full h-64 flex items-center justify-center">
                            <Loader2 className="animate-spin text-indigo-500" size={48} />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-500">
                            <Package size={48} className="opacity-20 mb-4" />
                            <p className="font-medium text-lg">No se encontraron productos</p>
                        </div>
                    ) : (
                        filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white p-5 rounded-[2rem] border border-slate-200 hover:border-indigo-200 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-sm"
                            >
                                <div className="h-40 bg-slate-50 rounded-[1.5rem] mb-5 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 transition-colors">
                                    <Package size={48} className="group-hover:scale-110 group-hover:text-indigo-600 transition-all duration-500" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 w-fit px-2.5 py-1 rounded-full border border-indigo-100">
                                        <Tag size={10} />
                                        Producto
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg truncate pt-1">{product.nombre}</h3>
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black text-slate-900">${Number(product.precio).toFixed(2)}</span>
                                            <span className={`text-xs font-bold ${product.stock < 10 ? 'text-rose-500' : 'text-slate-400'}`}>Stock: {product.stock}</span>
                                        </div>
                                        <button className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-90 text-white">
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="w-[26rem] flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <ShoppingCart className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Carrito de Compra</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{cart.reduce((a, b) => a + b.cantidad, 0)} artículos</p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cliente</label>
                        <select
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer"
                            value={selectedClient?.id || ''}
                            onChange={(e) => {
                                const client = clients.find(c => c.id === e.target.value)
                                setSelectedClient(client || null)
                            }}
                        >
                            <option value="">Consumidor Final</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-elegant">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <ShoppingCart size={32} className="opacity-20" />
                            </div>
                            <p className="font-bold text-slate-400">Tu carrito está vacío</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-4 items-center group animate-slide-in">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-100">
                                    <Package size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{item.nombre}</p>
                                    <p className="text-xs text-slate-400 font-bold">${item.precio.toFixed(2)} c/u</p>
                                </div>
                                <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1) }} className="p-1 px-2 text-slate-500 hover:text-indigo-600 transition-colors"><Minus size={14} /></button>
                                    <span className="w-6 text-center text-xs font-bold text-slate-900">{item.cantidad}</span>
                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1) }} className="p-1 px-2 text-slate-500 hover:text-indigo-600 transition-colors"><Plus size={14} /></button>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id) }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-slate-500 font-bold">
                            <span>Subtotal</span>
                            <span className="text-slate-900">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500 font-bold">
                            <span>IVA (16%)</span>
                            <span className="text-slate-900">${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-2xl font-black text-slate-900 border-t border-slate-200 pt-5 mt-2">
                            <span>TOTAL</span>
                            <span className="text-indigo-600">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleCheckout('efectivo')}
                            disabled={isCheckingOut || cart.length === 0}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <DollarSign size={20} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Efectivo</span>
                        </button>
                        <button
                            onClick={() => handleCheckout('tarjeta')}
                            disabled={isCheckingOut || cart.length === 0}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <CreditCard size={20} className="text-sky-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tarjeta</span>
                        </button>
                        <button
                            onClick={generateCuotas}
                            disabled={isCheckingOut || cart.length === 0}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-colors disabled:opacity-50 shadow-sm ${selectedClient ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Calendar size={20} className="text-indigo-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cuotas</span>
                        </button>
                    </div>

                    <button
                        onClick={() => handleCheckout('efectivo')}
                        disabled={isCheckingOut || cart.length === 0}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:grayscale text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                    >
                        {isCheckingOut ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : checkoutStatus === 'success' ? (
                            <CheckCircle2 className="text-emerald-400" size={20} />
                        ) : (
                            'Confirmar Venta'
                        )}
                        {checkoutStatus === 'success' ? '¡Vendido!' : checkoutStatus === 'error' ? 'Error' : ''}
                    </button>
                </div>
            </div>

            {/* Modal de Cuotas */}
            {isCuotasModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Configurar Crédito</h2>
                                <p className="text-sm text-slate-500 font-bold tracking-tight">Cliente: {selectedClient?.nombre}</p>
                            </div>
                            <button onClick={() => setIsCuotasModalOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Número de Cuotas</label>
                                <div className="flex gap-2">
                                    {[2, 3, 4, 6, 12].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setNumCuotas(n)}
                                            className={`flex-1 py-3 rounded-xl font-bold border transition-all ${numCuotas === n ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Plan de Pagos Sugerido</p>
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                    {cuotasData.map((c, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-black flex items-center justify-center text-slate-400">{i + 1}</span>
                                                <span className="text-xs font-bold text-slate-600">{new Date(c.fecha_vencimiento).toLocaleDateString()}</span>
                                            </div>
                                            <span className="font-black text-slate-900">${Number(c.monto).toLocaleString('es-CL')}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-xs font-black text-slate-400 uppercase">Monto Total a Crédito</span>
                                    <span className="text-lg font-black text-indigo-600">${total.toLocaleString('es-CL')}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleCheckout('cuotas', cuotasData)}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={20} />
                                Confirmar Venta a Crédito
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default POS
