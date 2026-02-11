import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, ShoppingBag, ArrowRight, Star, ShieldCheck, Zap, Loader2 } from 'lucide-react'

const Catalogo = () => {
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .order('nombre', { ascending: true })
        if (!error) setProductos(data)
        setLoading(false)
    }

    const filteredProducts = productos.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navbar Minimalista */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 border-b border-slate-100 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">C</div>
                    <span className="text-xl font-black tracking-tighter text-slate-900">CRMota Store</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-500">
                    <a href="#" className="hover:text-indigo-600 transition-colors">Novedades</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">Categorías</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">Ofertas</a>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                    <button className="p-2 hover:text-indigo-600 transition-colors"><Search size={22} /></button>
                    <button className="relative p-2 hover:text-indigo-600 transition-colors">
                        <ShoppingBag size={22} />
                        <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-600 rounded-full text-[10px] flex items-center justify-center border-2 border-white text-white">2</span>
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-48 pb-20 px-6 overflow-hidden bg-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-[150px]"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-black uppercase tracking-widest animate-fade-in">
                        <Zap size={14} fill="currentColor" /> Nueva Colección 2026
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight text-slate-900">
                        Tecnología que <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent">define el futuro.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
                        Descubre nuestra selección exclusiva de dispositivos de alta gama.
                        Calidad garantizada, envío express y soporte 24/7.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-4 pt-4">
                        <button className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-indigo-600/20">
                            Explorar Catálogo <ArrowRight size={20} />
                        </button>
                        <button className="px-10 py-5 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                            Ver Ofertas
                        </button>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">Productos Destacados</h2>
                        <p className="text-slate-500 font-medium italic">Seleccionados cuidadosamente para ti</p>
                    </div>
                    <button className="text-sm font-bold text-indigo-400 flex items-center gap-2 hover:underline">
                        Ver todo <ArrowRight size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {loading ? (
                        <div className="col-span-full py-20 text-center">
                            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-400 italic font-medium">
                            No se encontraron productos disponibles en este momento.
                        </div>
                    ) : (
                        filteredProducts.map(producto => (
                            <div key={producto.id} className="group cursor-pointer">
                                <div className="relative aspect-[4/5] bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden mb-6 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:translate-y-[-8px]">
                                    <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-slate-100 shadow-sm">
                                            Stock: {producto.stock}
                                        </span>
                                    </div>
                                    <div className="w-full h-full flex items-center justify-center p-8">
                                        {producto.imagen_url ? (
                                            <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <ShoppingBag size={80} className="text-slate-100 group-hover:scale-110 group-hover:text-indigo-50/50 transition-all duration-700" />
                                        )}
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                        <button className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl shadow-xl shadow-indigo-600/20 active:scale-95 hover:bg-indigo-500 transition-all">
                                            Ver Detalles
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-bold text-xl group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate text-slate-800">{producto.nombre}</h3>
                                        <span className="font-black text-slate-900 text-lg whitespace-nowrap">${Number(producto.precio).toLocaleString('es-CL')}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 h-8 font-medium italic">{producto.descripcion}</p>
                                    <div className="flex items-center gap-1 text-amber-400 pt-2">
                                        <Star size={12} fill="currentColor" />
                                        <Star size={12} fill="currentColor" />
                                        <Star size={12} fill="currentColor" />
                                        <Star size={12} fill="currentColor" />
                                        <Star size={12} fill="currentColor" />
                                        <span className="text-[10px] text-slate-400 font-bold ml-1 tracking-widest">(5.0)</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Footer Minimalista */}
            <footer className="border-t border-slate-100 py-20 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white">C</div>
                            <span className="text-2xl font-black tracking-tighter text-slate-900">CRMota</span>
                        </div>
                        <p className="text-slate-500 max-w-xs font-medium italic">Elevando el estándar del comercio inteligente con diseño y tecnología de punta.</p>
                    </div>
                    <div className="flex gap-10 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                        <a href="#" className="hover:text-indigo-600 transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Términos</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Soporte</a>
                    </div>
                    <div className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Compra 100% Segura</span>
                    </div>
                </div>
                <div className="mt-20 text-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
                    © 2026 CRMota Systems. All Rights Reserved.
                </div>
            </footer>
        </div>
    )
}

export default Catalogo
