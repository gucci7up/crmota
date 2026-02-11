import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Save, Loader2, Building2, MessageCircle, ShieldCheck, Globe, Mail, Phone, MapPin, DollarSign, Printer } from 'lucide-react'

const Configuracion = () => {
    const { user, profile } = useAuth()
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [config, setConfig] = useState({
        empresa_nombre: '',
        empresa_email: '',
        empresa_telefono: '',
        empresa_direccion: '',
        iva_percentage: 16,
        whatsapp_token: '',
        whatsapp_phone_id: '',
        whatsapp_verify_token: ''
    })

    // Configuración Local
    const [printerFormat, setPrinterFormat] = useState(localStorage.getItem('printerFormat') || 'a4')
    const [printMode, setPrintMode] = useState(localStorage.getItem('printMode') || 'browser')

    useEffect(() => {
        if (user) {
            fetchConfig()
        }
    }, [user])

    const fetchConfig = async () => {
        setLoading(true)
        // Intentamos obtener de una tabla 'configuracion' o del perfil
        const { data, error } = await supabase
            .from('profiles')
            .select('*') // This should include iva_percentage if it exists
            .eq('id', user.id)
            .single()

        console.log('Fetched profile data:', data)
        setConfig({
            empresa_nombre: data.empresa_nombre || '',
            empresa_email: data.empresa_email || user.email || '',
            empresa_telefono: data.empresa_telefono || '',
            empresa_direccion: data.empresa_direccion || '',
            iva_percentage: data.iva_percentage ?? 16, // Use ?? to allow 0
            whatsapp_token: data.whatsapp_token || '',
            whatsapp_phone_id: data.whatsapp_phone_id || '',
            whatsapp_verify_token: data.whatsapp_verify_token || ''
        })
        setLoading(false)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const updates = {
                empresa_nombre: config.empresa_nombre,
                empresa_email: config.empresa_email,
                empresa_telefono: config.empresa_telefono,
                empresa_direccion: config.empresa_direccion,
                iva_percentage: config.iva_percentage,
                whatsapp_token: config.whatsapp_token,
                whatsapp_phone_id: config.whatsapp_phone_id,
                whatsapp_verify_token: config.whatsapp_verify_token
                // updated_at removed to avoid schema error
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)

            if (error) throw error
            alert('Configuración guardada correctamente')
        } catch (error) {
            console.error('Error saving config:', error)
            alert(`Error: ${error.message || error.details || error.hint || 'Revise la consola'}`)
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
        </div>
    )

    return (
        <div className="space-y-10 animate-fade-in pb-20 text-slate-900">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configuración Sistema</h1>
                <p className="text-slate-500 font-medium italic mt-1">Personaliza tu perfil empresarial e integraciones</p>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Perfil de Empresa */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-8 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
                            <Building2 size={24} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">Perfil de Empresa</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={12} /> Nombre Comercial
                            </label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all font-medium"
                                value={config.empresa_nombre}
                                onChange={(e) => setConfig({ ...config, empresa_nombre: e.target.value })}
                                placeholder="Ej: CRMota Solutions"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Mail size={12} /> Email Contacto
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-5 py-4 glass border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-white font-medium"
                                    value={config.empresa_email}
                                    onChange={(e) => setConfig({ ...config, empresa_email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={12} /> Teléfono Negocio
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 glass border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-white font-medium"
                                    value={config.empresa_telefono}
                                    onChange={(e) => setConfig({ ...config, empresa_telefono: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={12} /> Dirección Física
                            </label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 glass border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-white font-medium"
                                value={config.empresa_direccion}
                                onChange={(e) => setConfig({ ...config, empresa_direccion: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={12} /> Impuesto (%)
                            </label>
                            <input
                                type="number"
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all font-medium"
                                value={config.iva_percentage}
                                onChange={(e) => setConfig({ ...config, iva_percentage: e.target.value })}
                                placeholder="16"
                            />
                        </div>
                    </div>
                </div>

                {/* WhatsApp Cloud API */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-8 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
                            <MessageCircle size={24} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">WhatsApp Cloud API</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Access Token (Permanente)</label>
                            <input
                                type="password"
                                className="w-full px-5 py-4 glass border-white/5 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-white font-medium"
                                value={config.whatsapp_token}
                                onChange={(e) => setConfig({ ...config, whatsapp_token: e.target.value })}
                                placeholder="EAABw..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone Number ID</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all font-medium"
                                    value={config.whatsapp_phone_id}
                                    onChange={(e) => setConfig({ ...config, whatsapp_phone_id: e.target.value })}
                                />
                                admissions: []
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Webhook Verify Token</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 glass border-white/5 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-white font-medium"
                                    value={config.whatsapp_verify_token}
                                    onChange={(e) => setConfig({ ...config, whatsapp_verify_token: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                            <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
                            <p className="text-[10px] font-black text-slate-400 italic">
                                Estos datos son necesarios para que el sistema pueda enviar notificaciones automáticas de ventas a tus clientes vía WhatsApp.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Configuración Local (Impresora) */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-8 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100 shadow-sm">
                            <Printer size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Configuración de Impresión (Local)</h2>
                            <p className="text-sm text-slate-500 font-medium">Estas opciones se guardan en este dispositivo.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { id: 'a4', label: 'Carta / A4 (Estándar)', desc: 'Para impresoras normales' },
                            { id: '80mm', label: 'Ticket 80mm', desc: 'Térmica estándar (Punto de Venta)' },
                            { id: '58mm', label: 'Ticket 58mm', desc: 'Térmica pequeña (Portátil)' }
                        ].map((format) => (
                            <label key={format.id} className={`relation cursor-pointer p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] ${printerFormat === format.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <input
                                        type="radio"
                                        name="printerFormat"
                                        value={format.id}
                                        checked={printerFormat === format.id}
                                        onChange={(e) => {
                                            setPrinterFormat(e.target.value)
                                            localStorage.setItem('printerFormat', e.target.value)
                                        }}
                                        className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span className="font-black text-slate-900">{format.label}</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium pl-8">{format.desc}</p>
                            </label>
                        ))}
                    </div>

                    {/* Print Mode (Browser vs Bluetooth) */}
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Modo de Impresión</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className={`relation cursor-pointer p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] ${printMode === 'browser' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <input
                                        type="radio"
                                        name="printMode"
                                        value="browser"
                                        checked={printMode === 'browser'}
                                        onChange={(e) => {
                                            setPrintMode(e.target.value)
                                            localStorage.setItem('printMode', e.target.value)
                                        }}
                                        className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span className="font-black text-slate-900">Navegador (PDF)</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium pl-8">Usa el diálogo de impresión del sistema. Mejor para A4/Carta.</p>
                            </label>

                            <label className={`relation cursor-pointer p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] ${printMode === 'bluetooth' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <input
                                        type="radio"
                                        name="printMode"
                                        value="bluetooth"
                                        checked={printMode === 'bluetooth'}
                                        onChange={(e) => {
                                            setPrintMode(e.target.value)
                                            localStorage.setItem('printMode', e.target.value)
                                        }}
                                        className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span className="font-black text-slate-900">Bluetooth (Nativo)</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium pl-8">Conexión directa a impresora térmica. Solo Chrome/Android.</p>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Guardar Configuración Global
                    </button>
                </div>
            </form>
        </div>
    )
}

export default Configuracion
