import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogIn, Lock, Mail, Loader2 } from 'lucide-react'

const Login = () => {
    const [isRegister, setIsRegister] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const { signIn, signUp } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        if (isRegister) {
            const { error } = await signUp(email, password, { nombre: name, rol: 'admin' })
            if (error) setError(error.message)
            else setSuccess('¡Cuenta creada! Revisa tu correo o intenta iniciar sesión.')
        } else {
            const { error } = await signIn(email, password)
            if (error) setError(error.message)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
                <div className="p-10 text-center border-b border-slate-100 relative bg-slate-50/50">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 font-black text-3xl text-white shadow-2xl shadow-indigo-600/20 rotate-3 transition-transform hover:rotate-0 duration-500">
                        C
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">CRMota</h1>
                    <p className="text-slate-500 mt-2 font-bold">{isRegister ? 'Crear Nueva Cuenta' : 'Panel de Gestión Empresarial'}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-7">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-bold">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl text-sm font-bold">
                            {success}
                        </div>
                    )}

                    {isRegister && (
                        <div className="space-y-2.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                            <div className="relative group">
                                <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" size={18} />
                                <input
                                    type="text"
                                    required
                                    placeholder="Juan Pérez"
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 transition-all font-bold placeholder:text-slate-300"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" size={18} />
                            <input
                                type="email"
                                required
                                placeholder="tu@empresa.com"
                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 transition-all font-bold placeholder:text-slate-300"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" size={18} />
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 transition-all font-bold placeholder:text-slate-300"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4.5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden relative group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <LogIn size={20} className="transition-transform group-hover:translate-x-1" />
                                <span>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                            </>
                        )}
                        <div className="absolute inset-0 bg-white/10 translate-y-full transition-transform group-hover:translate-y-0" />
                    </button>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-xs text-slate-400 hover:text-indigo-600 font-black uppercase tracking-[0.2em] transition-colors"
                        >
                            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login
