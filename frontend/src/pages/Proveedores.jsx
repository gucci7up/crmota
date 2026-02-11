import React, { useState, useEffect } from 'react'
import { Truck, Search, Phone, Mail, Plus, MapPin, X, Save, Loader2, Trash2, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Proveedores = () => {
    const [proveedores, setProveedores] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [editingProv, setEditingProv] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({
        nombre: '',
        contacto: '',
        email: '',
        telefono: '',
        categoria: '',
        sitio_web: '',
        direccion: ''
    })

    useEffect(() => {
        fetchProveedores()
    }, [])

    const fetchProveedores = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('proveedores')
            .select('*')
            .order('nombre')

        if (!error) setProveedores(data)
        setIsLoading(false)
    }

    const resetForm = () => {
        setFormData({
            nombre: '',
            contacto: '',
            email: '',
            telefono: '',
            categoria: '',
            sitio_web: '',
            direccion: ''
        })
        setEditingProv(null)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setIsSaving(true)

        const payload = {
            nombre: formData.nombre,
            contacto: formData.contacto,
            email: formData.email,
            telefono: formData.telefono,
            categoria: formData.categoria,
            sitio_web: formData.sitio_web,
            direccion: formData.direccion
        }

        let result
        if (editingProv) {
            result = await supabase
                .from('proveedores')
                .update(payload)
                .eq('id', editingProv.id)
        } else {
            result = await supabase
                .from('proveedores')
                .insert([payload])
        }

        if (result.error) {
            alert('Error al guardar proveedor: ' + result.error.message)
        } else {
            setIsModalOpen(false)
            resetForm()
            fetchProveedores()
        }
        setIsSaving(false)
    }

    const handleEdit = (prov) => {
        setEditingProv(prov)
        setFormData({
            nombre: prov.nombre || '',
            contacto: prov.contacto || '',
            email: prov.email || '',
            telefono: prov.telefono || '',
            categoria: prov.categoria || '',
            sitio_web: prov.sitio_web || '',
            direccion: prov.direccion || ''
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este proveedor?')) return

        const { error } = await supabase
            .from('proveedores')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error al eliminar: ' + error.message)
        } else {
            fetchProveedores()
        }
    }

    const filteredProveedores = proveedores.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contacto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-10 animate-fade-in text-slate-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Proveedores</h1>
                    <p className="text-slate-500 font-medium italic mt-1">Gestión de abastecimiento y cadena de suministro</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar proveedor..."
                            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true) }}
                        className="flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95 group"
                    >
                        <Plus size={20} className="transition-transform group-hover:rotate-12" />
                        Nuevo
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                </div>
            ) : filteredProveedores.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                    <Truck size={48} className="opacity-20 mb-4" />
                    <p className="font-bold">No se encontraron proveedores</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProveedores.map(p => (
                        <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-indigo-200 transition-all duration-300 group shadow-sm flex flex-col">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                                    <Truck size={32} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(p)}
                                        className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    >
                                        <X className="rotate-45" size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 mb-2 inline-block">
                                    {p.categoria || 'Sin Categoría'}
                                </span>
                                <h3 className="text-xl font-black text-slate-900 mb-2">{p.nombre}</h3>
                                {p.contacto && (
                                    <p className="text-sm text-slate-500 font-bold mb-4">Contacto: {p.contacto}</p>
                                )}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    {p.telefono && (
                                        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                            <Phone size={16} className="text-indigo-600" />
                                            {p.telefono}
                                        </div>
                                    )}
                                    {p.email && (
                                        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                            <Mail size={16} className="text-indigo-600" />
                                            {p.email}
                                        </div>
                                    )}
                                    {p.sitio_web && (
                                        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                            <Globe size={16} className="text-indigo-600" />
                                            {p.sitio_web}
                                        </div>
                                    )}
                                    {p.direccion && (
                                        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                            <MapPin size={16} className="text-indigo-600" />
                                            {p.direccion}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Proveedor */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{editingProv ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                                <p className="text-sm text-slate-500 font-bold tracking-tight">Administra la relación con tus abastecedores</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre de la Empresa</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Ej: Distribuidora Central"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Contacto</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.contacto}
                                        onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                                        placeholder="Ej: Pedro Martínez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Corporativo</label>
                                    <input
                                        type="email"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="ventas@empresa.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Teléfono de Contacto</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        placeholder="+56912345678"
                                    />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Categoría / Rubro</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        placeholder="Ej: Insumos de Oficina, Ferretería, etc."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Sitio Web</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.sitio_web}
                                        onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
                                        placeholder="https://www.empresa.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Dirección</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.direccion}
                                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        placeholder="Calle Falsa 123"
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
                                    {editingProv ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Proveedores
