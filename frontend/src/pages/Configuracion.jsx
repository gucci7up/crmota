import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Save, Loader2, Building2, MessageCircle, ShieldCheck, Globe, Mail, Phone, MapPin, DollarSign } from 'lucide-react'

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
            .select('*')
            .eq('id', user.id)
            .single()

        if (data) {
            setConfig({
                empresa_nombre: data.empresa_nombre || '',
                empresa_email: data.empresa_email || user.email || '',
                empresa_telefono: data.empresa_telefono || '',
                empresa_direccion: data.empresa_direccion || '',
                iva_percentage: data.iva_percentage || 16,
                whatsapp_token: data.whatsapp_token || '',
                whatsapp_phone_id: data.whatsapp_phone_id || '',
                whatsapp_verify_token: data.whatsapp_verify_token || ''
            })
        }
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
