import React, { useRef, useState } from 'react'
import { X, Download, Printer, Loader2 } from 'lucide-react'
import InvoiceTemplate from './InvoiceTemplate'
// Import html2pdf dynamically if possible, or assume it's available globally if added via CDN, 
// but since we added it to package.json, we should try to import it.
// However, html2pdf.js often has issues with ES6 imports depending on the version. 
// We will try standard import.
import html2pdf from 'html2pdf.js'

const PrintPreviewModal = ({ isOpen, onClose, invoice, format = 'a4' }) => {
    const [isGenerating, setIsGenerating] = useState(false)
    const contentRef = useRef(null)

    if (!isOpen || !invoice) return null

    const handleDownloadPDF = async () => {
        setIsGenerating(true)
        const element = contentRef.current

        const opt = {
            margin: [0, 0, 0, 0], // No margins for thermal
            filename: `Factura-${invoice.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: format === 'a4' ? 'a4' : [format === '80mm' ? 80 : 58, 200], orientation: 'portrait' }
        }

        // Adjust format for jsPDF if thermal
        // Note: jsPDF format for custom size usually takes [width, height]. 
        // Height needs to be dynamic or long enough. 
        // For 'a4' it's standard.
        // For thermal, we might want a long strip or just let it paginate.
        // Let's use a fixed long height for thermal to simulate a roll if possible, 
        // or just 'a4' for simplicity if the user wants a PDF record.
        // BUT, the user wants thermal PDF usually for sharing via WhatsApp etc.
        // Let's stick to A4 for PDF download for now unless format is strictly thermal, 
        // then we try to match width.

        if (format === '80mm') {
            opt.jsPDF.format = [80, 297] // 80mm width, A4 height equivalent
        } else if (format === '58mm') {
            opt.jsPDF.format = [58, 297]
        }

        try {
            console.log("Generating PDF from element:", element)
            console.log("html2pdf library:", html2pdf)
            await html2pdf().set(opt).from(element).save()
        } catch (error) {
            console.error("PDF Generation Error:", error)
            alert("Error generando PDF: " + (error.message || error))
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto print:block">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl print:shadow-none print:w-full print:max-w-none print:max-h-none print:rounded-none print:overflow-visible">

                {/* Header - Hidden on Print */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Vista Previa de Impresión</h2>
                        <p className="text-sm text-slate-500">Formato: <span className="font-bold uppercase">{format}</span></p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                            Descargar PDF
                        </button>

                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                            <Printer size={18} />
                            Imprimir
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-colors hover:bg-slate-50"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area - Scrollable on Screen, Full on Print */}
                <div className="flex-1 overflow-y-auto bg-slate-100/50 p-8 print:p-0 print:bg-white print:overflow-visible flex justify-center">
                    <div className="bg-white shadow-xl print:shadow-none print:w-full">
                        <div ref={contentRef} className="print-content">
                            <InvoiceTemplate venta={invoice} format={format} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PrintPreviewModal
