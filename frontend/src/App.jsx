import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Clientes from './pages/Clientes'
import Productos from './pages/Productos'

import Login from './pages/Login'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div>Cargando...</div>
  return user ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
          <Route path="/productos" element={<PrivateRoute><Productos /></PrivateRoute>} />
          {/* Catalogo Publico */}
          <Route path="/catalogo" element={<div>Catálogo Online Público</div>} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
