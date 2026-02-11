import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, MoreVertical, Edit2, Trash2, Phone, Mail, UserPlus, Filter, Loader2, X, Save } from 'lucide-react'

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
    const [editingClient, setEditingClient] = useState(null)
    const [formData, setFormData] = useState(initialForm)
    const [isSaving, setIsSaving] = useState(false)

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

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-10 animate-fade-in text-slate-900">
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
                    <div className="flex gap-3">
                        <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-6">Información del Cliente</th>
                                <th className="px-8 py-6">Identificación</th>
                                <th className="px-8 py-6">Contacto Directo</th>
                                <th className="px-8 py-6">Estado de Cuenta</th>
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

                <div className="p-6 bg-slate-50/50 text-center border-t border-slate-100">
                    <button className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">
                        Ver todos los clientes registrados
                    </button>
                </div>
            </div>

            {/* Modal de Cliente */}
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
        </div>
    )
}

export default Clientes
