import React from 'react'
import Sidebar from '../components/Sidebar'

const DashboardLayout = ({ children }) => {
    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}

export default DashboardLayout
