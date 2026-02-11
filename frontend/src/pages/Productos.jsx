import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, Search, Package, AlertTriangle, ArrowUpDown, Tag, Edit2, Trash2, Filter, Loader2, X, Save } from 'lucide-react'

const initialForm = {
    nombre: '',
    sku: '',
    descripcion: '',
    precio: 0,
    precio_compra: 0,
    stock: 0,
    stock_min: 5,
    categoria_id: '',
    imagen_url: ''
}

const Productos = () => {
    const { session } = useAuth()
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [formData, setFormData] = useState(initialForm)
    const [isSaving, setIsSaving] = useState(false)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [prodRes, catRes] = await Promise.all([
            supabase.from('productos').select('*').order('nombre', { ascending: true }),
            supabase.from('categorias').select('*').order('nombre', { ascending: true })
        ])

        if (!prodRes.error) setProductos(prodRes.data)
        if (!catRes.error) setCategorias(catRes.data)
        setLoading(false)
    }

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product)
            setFormData(product)
            setImagePreview(product.imagen_url)
        } else {
            setEditingProduct(null)
            setFormData(initialForm)
            setImagePreview(null)
        }
        setImageFile(null)
        setIsModalOpen(true)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const uploadImage = async () => {
        if (!imageFile) return formData.imagen_url

        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile)

        try {
            // Use relative path to match POS.jsx logic (assuming proxy or same-origin)
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            })

            if (!response.ok) {
                const text = await response.text()
                console.error('Upload failed with status ' + response.status + ':', text)
                try {
                    const errorData = JSON.parse(text)
                    throw new Error(errorData.error || 'Error subiendo imagen')
                } catch (e) {
                    throw new Error('Error subiendo imagen: ' + response.statusText)
                }
            }

            const data = await response.json()
            return data.url
        } catch (error) {
            console.error('Error uploading image:', error)
            throw error
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const imageUrl = await uploadImage()
            const finalData = { ...formData, imagen_url: imageUrl }

            if (editingProduct) {
                const { error } = await supabase
                    .from('productos')
                    .update(finalData)
                    .eq('id', editingProduct.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('productos')
                    .insert([finalData])
                if (error) throw error
            }
            fetchData()
            setIsModalOpen(false)
        } catch (error) {
            console.error('Error saving product:', error)
            alert('Error al guardar producto: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            const { error } = await supabase
                .from('productos')
                .delete()
                .eq('id', id)
            if (!error) fetchData()
        }
    }

    const handleCreateCategory = async (e) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return

        setIsCreatingCategory(true)
        try {
            const response = await fetch('/api/categorias', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ nombre: newCategoryName })
            })

            if (!response.ok) {
                const text = await response.text()
                throw new Error(text || 'Error al crear categoría')
            }

            const result = await response.json()

            // Recargar categorías
            const { data, error } = await supabase.from('categorias').select('*').order('nombre', { ascending: true })
            if (!error) setCategorias(data)

            setNewCategoryName('')
            setIsCategoryModalOpen(false)
            alert('Categoría creada con éxito')
        } catch (error) {
            console.error('Error creating category:', error)
            alert(error.message || 'Error al crear categoría')
        } finally {
            setIsCreatingCategory(false)
        }
    }

    const filteredProductos = productos.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const stats = {
        total: productos.length,
        lowStock: productos.filter(p => p.stock < p.stock_min).length,
        categories: categorias.length
    }
    return (
        <div className="space-y-10 animate-fade-in text-slate-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Inventario</h1>
                    <p className="text-slate-500 font-medium italic mt-1">Control de stock, precios y categorías</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="px-6 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    >
                        Categorías
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95 group"
                    >
                        <Plus size={20} className="transition-transform group-hover:rotate-12" />
                        Añadir Producto
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6 hover:translate-y-[-4px] transition-all shadow-sm">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
                        <Package size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Productos</p>
                        <p className="text-3xl font-black text-slate-900">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6 hover:translate-y-[-4px] transition-all shadow-sm">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shadow-sm">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Bajo Stock</p>
                        <p className="text-3xl font-black text-rose-600">{stats.lowStock}</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6 hover:translate-y-[-4px] transition-all shadow-sm">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 shadow-sm">
                        <Tag size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Categorías</p>
                        <p className="text-3xl font-black text-slate-900">{stats.categories}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-6 justify-between items-center">
                    <div className="relative w-full max-w-xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, SKU o código..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 transition-all font-medium"
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
                                <th className="px-8 py-6">Producto / SKU</th>
                                <th className="px-8 py-6">Categoría</th>
                                <th className="px-8 py-6">Precio Venta</th>
                                <th className="px-8 py-6">Precio Compra</th>
                                <th className="px-8 py-6">Stock Actual</th>
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
                            ) : filteredProductos.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-500 italic">
                                        No se encontraron productos en el inventario.
                                    </td>
                                </tr>
                            ) : (
                                filteredProductos.map(producto => (
                                    <tr key={producto.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-200 overflow-hidden shadow-sm">
                                                    {producto.imagen_url ? (
                                                        <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{producto.nombre}</p>
                                                    <p className="text-[10px] text-slate-400 font-black tracking-widest mt-0.5 uppercase">{producto.sku || 'SIN SKU'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                                                {categorias.find(c => c.id === producto.categoria_id)?.nombre || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-black text-slate-900">
                                            ${Number(producto.precio).toLocaleString('es-CL')}
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-slate-400">
                                            ${Number(producto.precio_compra || 0).toLocaleString('es-CL')}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                                    <div
                                                        className={`h-full transition-all ${producto.stock < producto.stock_min ? 'bg-rose-500' : 'bg-indigo-600'
                                                            }`}
                                                        style={{ width: `${Math.min(100, (producto.stock / 100) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-xs font-black ${producto.stock < producto.stock_min ? 'text-rose-500' : 'text-indigo-600'}`}>
                                                    {producto.stock} u.
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(producto)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(producto.id)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm">
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

            {/* Modal de Producto */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                                <p className="text-sm text-slate-500 font-bold tracking-tight">Información técnica y comercial</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="flex flex-col items-center gap-4 mb-6">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-indigo-400 transition-all">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Package size={40} className="text-slate-300" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                    />
                                    <div className="absolute inset-0 bg-indigo-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <ArrowUpDown size={24} className="text-white" />
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click para subir foto</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Producto</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Ej: Laptop Dell XPS 15"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">SKU / Código</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        placeholder="DELL-XPS-15-BL"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                                    <select
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold"
                                        value={formData.categoria_id}
                                        onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar Categoría</option>
                                        {categorias.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Precio de Venta</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.precio}
                                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Precio de Compra (Costo)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.precio_compra}
                                        onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Stock Actual</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Stock Mínimo (Alerta)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                        value={formData.stock_min}
                                        onChange={(e) => setFormData({ ...formData, stock_min: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                                    <textarea
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300 min-h-[100px]"
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
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
                                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Categoría */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Nueva Categoría</h2>
                                <p className="text-sm text-slate-500 font-bold tracking-tight">Crear una nueva categoría</p>
                            </div>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCategory} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre de la Categoría</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Ej: Electrónica"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isCreatingCategory}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                            >
                                {isCreatingCategory ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Crear Categoría
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Productos
