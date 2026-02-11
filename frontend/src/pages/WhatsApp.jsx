import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
    MessageSquare,
    Send,
    User,
    Search,
    MoreVertical,
    Phone,
    Video,
    Paperclip,
    Smile,
    ShoppingCart,
    FileText,
    CheckCheck,
    Clock,
    Search as SearchIcon,
    Loader2
} from 'lucide-react'

const WhatsApp = () => {
    const { user, profile } = useAuth()
    const [clients, setClients] = useState([])
    const [selectedClient, setSelectedClient] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [sales, setSales] = useState([])
    const [showSalesModal, setShowSalesModal] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        fetchClients()
    }, [])

    useEffect(() => {
        if (selectedClient) {
            fetchMessages(selectedClient.id)
            fetchClientSales(selectedClient.id)
        }
    }, [selectedClient])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchClients = async () => {
        setLoading(true)
        // Obtenemos clientes que tienen mensajes o simplemente todos los clientes activos
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nombre')

        if (!error) setClients(data)
        setLoading(false)
    }

    const fetchMessages = async (clientId) => {
        const { data, error } = await supabase
            .from('mensajes_whatsapp')
            .select('*')
            .eq('cliente_id', clientId)
            .order('created_at', { ascending: true })

        if (!error) setMessages(data)
    }

    const fetchClientSales = async (clientId) => {
        const { data, error } = await supabase
            .from('ventas')
            .select('*')
            .eq('cliente_id', clientId)
            .order('created_at', { ascending: false })

        if (!error) setSales(data)
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedClient || sending) return

        setSending(true)
        try {
            // 1. Guardar en Supabase (Optimista)
            const tempId = Date.now()
            const outgoingMsg = {
                cliente_id: selectedClient.id,
                mensaje: newMessage,
                tipo: 'outgoing',
                estado: 'sending',
                created_at: new Date().toISOString()
            }
            setMessages(prev => [...prev, outgoingMsg])
            setNewMessage('')

            // 2. Llamar API del Backend para enviar vía WhatsApp Cloud API
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: selectedClient.telefono,
                    message: outgoingMsg.mensaje,
                    client_id: selectedClient.id
                })
            })

            const result = await response.json()
            if (result.status === 'success') {
                // Actualizar estado en la lista local
                fetchMessages(selectedClient.id)
            } else {
                console.error("Error al enviar:", result.error)
            }
        } catch (error) {
            console.error("Error:", error)
        } finally {
            setSending(false)
        }
    }

    const shareSale = async (sale) => {
        const text = `Hola ${selectedClient.nombre}, te adjunto el detalle de tu compra #${sale.id.slice(0, 8)} por un total de $${Number(sale.total).toLocaleString('es-CL')}. ¡Gracias por preferirnos!`
        setNewMessage(text)
        setShowSalesModal(false)
    }

    const filteredClients = clients.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefono?.includes(searchTerm)
    )

    return (
        <div className="h-[calc(100vh-120px)] flex bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-fade-in text-slate-900">
            {/* Sidebar de Chats */}
            <div className="w-96 border-r border-slate-100 flex flex-col bg-slate-50/30">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Mensajes</h2>

                    {/* Connection Status */}
                    <div className="mb-4">
                        {profile?.whatsapp_phone_id ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>Conectado: {profile.whatsapp_phone_id}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                <span>No configurado</span>
                            </div>
                        )}
                    </div>

                    <div className="relative group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
                    ) : filteredClients.map(client => (
                        <div
                            key={client.id}
                            onClick={() => setSelectedClient(client)}
                            className={`p-5 border-b border-slate-50 cursor-pointer transition-all flex items-center gap-4 ${selectedClient?.id === client.id ? 'bg-white shadow-sm scale-[1.02] border-l-4 border-l-indigo-600' : 'hover:bg-white'}`}
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                                {client.nombre.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-slate-900 truncate">{client.nombre}</p>
                                    <span className="text-[10px] text-slate-400 font-bold">12:30 PM</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{client.telefono || 'Sin teléfono'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ventana de Chat */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedClient ? (
                    <>
                        {/* Header Chat */}
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                    {selectedClient.nombre.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900">{selectedClient.nombre}</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">En línea</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowSalesModal(true)}
                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Compartir Venta"
                                >
                                    <ShoppingCart size={20} />
                                </button>
                                <button className="p-3 text-slate-400 hover:text-slate-900 rounded-xl transition-all">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Mensajes */}
                        <div className="flex-1 overflow-y-auto p-8 bg-[url('https://w0.peakpx.com/wallpaper/508/606/HD-wallpaper-whatsapp-dark-solid-colors.jpg')] bg-repeat opacity-95">
                            <div className="space-y-6">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.tipo === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm relative group ${msg.tipo === 'outgoing' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'}`}>
                                            <p className="text-sm font-medium leading-relaxed">{msg.mensaje}</p>
                                            <div className={`flex items-center justify-end gap-1 mt-2 ${msg.tipo === 'outgoing' ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                <span className="text-[9px] font-bold">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {msg.tipo === 'outgoing' && (
                                                    <CheckCheck size={12} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-6 border-t border-slate-100 bg-white">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                <button type="button" className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
                                    <Paperclip size={20} />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Escribe un mensaje aquí..."
                                        className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-medium transition-all"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors">
                                        <Smile size={20} />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20">
                        <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-8 rotate-3 shadow-inner">
                            <MessageSquare size={64} className="opacity-10 -rotate-3" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Tu Centro de Mensajería</h3>
                        <p className="text-slate-500 font-medium text-center max-w-sm">Selecciona un cliente de la lista para iniciar una conversación o ver su historial de ventas.</p>
                    </div>
                )}
            </div>

            {/* Modal de Ventas */}
            {showSalesModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Ventas de {selectedClient.nombre}</h2>
                                <p className="text-sm text-slate-500 font-bold tracking-tight">Selecciona una venta para compartir el detalle</p>
                            </div>
                            <button onClick={() => setShowSalesModal(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                                <LogOut className="rotate-180" size={20} />
                            </button>
                        </div>
                        <div className="p-8 max-h-[500px] overflow-y-auto space-y-4">
                            {sales.length === 0 ? (
                                <p className="text-center text-slate-500 font-medium py-10">Este cliente no tiene ventas registradas.</p>
                            ) : sales.map(sale => (
                                <div
                                    key={sale.id}
                                    onClick={() => shareSale(sale)}
                                    className="p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all flex justify-between items-center group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">Venta #{sale.id.slice(0, 8)}</p>
                                            <p className="text-xs text-slate-400 font-black">{new Date(sale.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900">${Number(sale.total).toLocaleString('es-CL')}</p>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500">{sale.estado_pago || 'PAGADO'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default WhatsApp
