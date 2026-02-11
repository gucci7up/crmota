import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, MoreVertical, Edit2, Trash2, Phone, Mail, UserPlus, Filter, Loader2, X, Save, DollarSign, Clock, CheckCircle2, AlertCircle, TrendingDown, ChevronRight } from 'lucide-react'

const initialForm = {
    nombre: '',
    documento: '',
    email: '',
    telefono: '',
    direccion: '',
    notas: '',
    estado: 'activo'
}

const Clientes = () => {
    const [clientes, setClientes] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
    const [editingClient, setEditingClient] = useState(null)
    const [selectedAccountClient, setSelectedAccountClient] = useState(null)
    const [clientAccountData, setClientAccountData] = useState({ cuotas: [], pagos: [], totalDebt: 0, totalPaid: 0 })
    const [loadingAccount, setLoadingAccount] = useState(false)
    const [formData, setFormData] = useState(initialForm)
    const [isSaving, setIsSaving] = useState(false)

    // Global Payment State
    const [isGlobalPaymentModalOpen, setIsGlobalPaymentModalOpen] = useState(false)
    const [globalPaymentAmount, setGlobalPaymentAmount] = useState('')
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)


    useEffect(() => {
        fetchClientes()
    }, [])

    const fetchClientes = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nombre', { ascending: true })

        if (!error) setClientes(data)
        setLoading(false)
    }

    const fetchClientAccount = async (client) => {
        setLoadingAccount(true)
        setSelectedAccountClient(client)
        setIsAccountModalOpen(true)

        // Fetch sales and linked cuotas for this client
        const { data: ventas, error } = await supabase
            .from('ventas')
            .select(`
                id,
                total,
                created_at,
                metodo_pago,
                estado_pago,
                cuotas (
                    id,
                    monto,
                    monto_pagado,
                    fecha_vencimiento,
                    estado
                )
            `)
            .eq('cliente_id', client.id)
            .eq('metodo_pago', 'cuotas')

        // Fetch Payment History
        const { data: pagos, error: errorPagos } = await supabase
            .from('historial_pagos')
            .select('*')
            .eq('cliente_id', client.id)
            .order('created_at', { ascending: false })

        if (!error && ventas) {
            let allCuotas = []
            ventas.forEach(venta => {
                if (venta.cuotas) {
                    allCuotas = [...allCuotas, ...venta.cuotas.map(c => ({
                        ...c,
                        venta_id: venta.id,
                        venta_date: venta.created_at,
                        monto_pagado: c.monto_pagado || 0
                    }))]
                }
            })

            // Sort by due date
            allCuotas.sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento))

            const totalDebt = allCuotas.reduce((acc, c) => acc + (Number(c.monto) - Number(c.monto_pagado || 0)), 0)
            const totalPaid = allCuotas.reduce((acc, c) => acc + Number(c.monto_pagado || 0), 0)

            setClientAccountData({
                cuotas: allCuotas,
                pagos: pagos || [],
                totalDebt,
                totalPaid
            })
        }
        setLoadingAccount(false)
    }

    const handleOpenModal = (client = null) => {
        if (client) {
            setEditingClient(client)
            setFormData(client)
        } else {
            setEditingClient(null)
            setFormData(initialForm)
        }
        setIsModalOpen(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            if (editingClient) {
                const { error } = await supabase
                    .from('clientes')
                    .update(formData)
                    .eq('id', editingClient.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('clientes')
                    .insert([formData])
                if (error) throw error
            }
            fetchClientes()
            setIsModalOpen(false)
        } catch (error) {
            console.error('Error saving client:', error)
            alert('Error al guardar cliente')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', id)
            if (!error) fetchClientes()
        }
    }

    const handleProcessGlobalPayment = async (e) => {
        e.preventDefault()
        const amountToPay = Number(globalPaymentAmount)

        if (amountToPay <= 0) {
            alert('El monto debe ser mayor a 0')
            return
        }

        if (amountToPay > clientAccountData.totalDebt + 1) { // +1 margin for float tolerance
            alert('El monto excede la deuda total del cliente.')
            return
        }

        setIsProcessingPayment(true)
        try {
            // Check auth session
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                alert('Sesión expirada. Por favor inicie sesión nuevamente.')
                return
            }

            // Use standalone endpoint to bypass router issues
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/process_payment.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    cliente_id: selectedAccountClient.id,
                    monto: amountToPay,
                    metodo_pago: 'efectivo', // TODO: Add selector in UI for method
                    referencia: 'Abono desde Dashboard'
                })
            })

            const responseText = await response.text()
            console.log('Raw Server Response:', responseText)

            let result
            try {
                result = JSON.parse(responseText)
            } catch (e) {
                console.error('JSON Parse Error:', e)
                throw new Error(`Error del servidor (No JSON): ${responseText.substring(0, 50)}...`)
            }

            if (!response.ok) {
                throw new Error(result.error || 'Error desconocido en el servidor')
            }

            setIsGlobalPaymentModalOpen(false)
            setGlobalPaymentAmount('')
            alert(`Abono registrado correctamente. Monto aplicado: $${result.monto_abonado}`)

            // Refresh Account Data
            fetchClientAccount(selectedAccountClient)

        } catch (error) {
            console.error('Error processing payment:', error)
            alert('Error al procesar el pago: ' + error.message)
        } finally {
            setIsProcessingPayment(false)
        }
    }

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-10 animate-fade-in text-slate-900 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">CRM Clientes</h1>
                    <p className="text-slate-500 font-medium italic mt-1">Gestiona tu cartera de clientes e historial</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95 group"
                >
                    <UserPlus size={20} className="transition-transform group-hover:rotate-12" />
                    Registrar Nuevo Cliente
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50 transition-all duration-500">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-6 justify-between items-center">
                    <div className="relative w-full max-w-xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar cliente por nombre, NIT, documento o email..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 transition-all hover:bg-slate-50 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-6">Información del Cliente</th>
                                <th className="px-8 py-6">Identificación</th>
                                <th className="px-8 py-6">Contacto Directo</th>
                                <th className="px-8 py-6">Estado</th>
                                <th className="px-8 py-6 text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
                                    </td>
                                </tr>
                            ) : filteredClientes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-500 italic">
                                        No se encontraron clientes registrados.
                                    </td>
                                </tr>
                            ) : (
                                filteredClientes.map(cliente => (
                                    <tr key={cliente.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100 shadow-sm">
                                                    {cliente.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase">{cliente.nombre}</p>
                                                    <p className="text-xs text-slate-400 font-bold">Cliente desde {new Date(cliente.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-600 font-bold tracking-wider font-mono">
                                            {cliente.documento || 'S/N'}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                {cliente.telefono && (
                                                    <div className="flex items-center gap-2.5 text-xs text-slate-500 font-bold">
                                                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100"><Phone size={12} /></div>
                                                        {cliente.telefono}
                                                    </div>
                                                )}
                                                {cliente.email && (
                                                    <div className="flex items-center gap-2.5 text-xs text-slate-500 font-bold">
                                                        <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg border border-sky-100"><Mail size={12} /></div>
                                                        {cliente.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-widest ${cliente.estado === 'activo'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cliente.estado === 'activo' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                                {cliente.estado}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => fetchClientAccount(cliente)}
                                                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                                                    title="Ver Cuenta Corriente"
                                                >
                                                    <DollarSign size={16} />
                                                </button>
                                                <button onClick={() => handleOpenModal(cliente)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(cliente.id)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Cliente (Edición/Creación) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{editingClient ? 'Editar Cliente' : 'Registrar Cliente'}</h2>
                                <p className="text-sm text-slate-500 font-bold tracking-tight">Completa la información del cliente</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Identificación / RUT</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.documento}
                                        onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                                        placeholder="12.345.678-K"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@ejemplo.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Teléfono / WhatsApp</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        placeholder="+56912345678"
                                    />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Dirección</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.direccion}
                                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        placeholder="Av. Principal 123, Depto 45"
                                    />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Notas Adicionales</label>
                                    <textarea
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300 min-h-[100px]"
                                        value={formData.notas}
                                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                        placeholder="Información relevante del cliente..."
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 rounded-[1.5rem] font-bold text-slate-500 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3 px-12"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    {editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Cuenta Corriente (Deudas) */}
            {isAccountModalOpen && selectedAccountClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Estado de Cuenta</h2>
                                <p className="text-sm text-slate-500 font-bold tracking-tight uppercase">{selectedAccountClient.nombre}</p>
                            </div>
                            <button onClick={() => setIsAccountModalOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto scrollbar-elegant">
                            {loadingAccount ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Actions Header - NEW GLOBAL PAYMENT BUTTON */}
                                    <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 gap-6">
                                        <div className="text-center md:text-left">
                                            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Deuda Total Pendiente</p>
                                            <p className="text-5xl font-black text-indigo-900">${clientAccountData.totalDebt.toLocaleString('es-CL')}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsGlobalPaymentModalOpen(true)}
                                            disabled={clientAccountData.totalDebt <= 0}
                                            className="w-full md:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-4 text-lg"
                                        >
                                            <DollarSign size={28} />
                                            REGISTRAR ABONO
                                        </button>
                                    </div>

                                    {/* Lista de Pagos / Abonos */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Historial de Abonos</h3>

                                        {clientAccountData.pagos.length === 0 ? (
                                            <div className="py-12 text-center text-slate-400 italic bg-gray-50 rounded-2xl border border-gray-100">
                                                No hay abonos registrados.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {clientAccountData.pagos.map((pago, idx) => (
                                                    <div key={idx} className="p-5 rounded-2xl border bg-emerald-50/30 border-emerald-100 flex items-center justify-between transition-all">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg bg-emerald-100 text-emerald-600">
                                                                <CheckCircle2 size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-lg">
                                                                    Abono Recibido
                                                                </p>
                                                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                                                                    {new Date(pago.created_at).toLocaleDateString()} &bull; {pago.referencia || 'Sin referencia'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <p className="text-2xl font-black text-emerald-600">
                                                                ${Number(pago.monto).toLocaleString('es-CL')}
                                                            </p>
                                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                                                                CONFIRMADO
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Abono Global */}
            {isGlobalPaymentModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Registrar Abono</h2>
                                <p className="text-sm text-slate-500 font-bold tracking-tight">Abonar a la deuda general</p>
                            </div>
                            <button onClick={() => setIsGlobalPaymentModalOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleProcessGlobalPayment} className="p-8 space-y-6">
                            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 text-center space-y-2">
                                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Deuda Total a Pagar</p>
                                <p className="text-4xl font-black text-indigo-900">${clientAccountData.totalDebt.toLocaleString('es-CL')}</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Monto del Abono</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                                    <input
                                        type="number"
                                        min="1"
                                        max={clientAccountData.totalDebt + 1}
                                        required
                                        autoFocus
                                        className="w-full pl-14 pr-4 py-5 bg-white border border-slate-200 rounded-2xl text-3xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={globalPaymentAmount}
                                        onChange={(e) => setGlobalPaymentAmount(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-xs text-center text-slate-400 font-medium">
                                    El sistema distribuirá este monto automáticamente entre las cuotas más antiguas.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessingPayment}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                            >
                                {isProcessingPayment ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                Confirmar Abono
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Clientes
