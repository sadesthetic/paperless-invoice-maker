import React, { useState, useRef, useEffect } from 'react';
import { CompanyInfo, DocumentData, LineItem } from './types';
import { Download, Printer, Plus, Trash2, FileText, Receipt, User, Building, Settings, CheckCircle2, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from './lib/utils';
import { QRCodeSVG } from 'qrcode.react';

const DEFAULT_COMPANY: CompanyInfo = {
  name: "My Studio",
  address: "123 Creative Ave, Design City",
  email: "hello@mystudio.com",
  phone: "+1 (555) 000-1111",
  website: "www.mystudio.com"
};

const INITIAL_DATA: DocumentData = {
  type: 'Invoice',
  number: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  customer: {
    name: "John Doe",
    address: "456 Client St, Business Town",
    email: "john@example.com",
    phone: "+1 (555) 222-3333"
  },
  items: [
    { id: '1', description: 'Brand Identity Design', quantity: 1, price: 1200 },
    { id: '2', description: 'Website Development', quantity: 1, price: 2500 }
  ],
  currency: '$',
  notes: 'Thank you for your business!',
  taxRate: 0,
  paymentLink: 'https://pay.me/mystudio',
  showQr: true
};

export default function App() {
  const [data, setData] = useState<DocumentData>(INITIAL_DATA);
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * (data.taxRate / 100);
  const total = subtotal + tax;

  const addItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      price: 0
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    setData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.type}_${data.number}.pdf`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* Minimal Header */}
      <header className="max-w-5xl mx-auto px-6 py-12 flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-black">Paperless</h1>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-2">Minimalist {data.type} Maker</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-black"
          >
            <Printer size={20} />
          </button>
          <button 
            onClick={handleExport}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            <Download size={18} />
            {isGenerating ? 'Saving...' : 'Export'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Form Side */}
        <div className="space-y-12 print:hidden">
          {/* Document Type Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setData(prev => ({ ...prev, type: 'Invoice' }))}
              className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-all", data.type === 'Invoice' ? "bg-white shadow-sm text-black" : "text-gray-500")}
            >
              Invoice
            </button>
            <button 
              onClick={() => setData(prev => ({ ...prev, type: 'Receipt' }))}
              className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-all", data.type === 'Receipt' ? "bg-white shadow-sm text-black" : "text-gray-500")}
            >
              Receipt
            </button>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {/* Company & Client */}
            <div className="grid grid-cols-1 gap-8">
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Building size={12} /> From
                </h3>
                <input 
                  type="text" 
                  value={company.name} 
                  onChange={e => setCompany(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your Name / Studio"
                  className="w-full text-xl font-light border-b border-gray-100 focus:border-black outline-none py-2 transition-colors"
                />
                <input 
                  type="text" 
                  value={company.address} 
                  onChange={e => setCompany(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Address"
                  className="w-full text-sm text-gray-500 border-b border-gray-100 focus:border-black outline-none py-1 transition-colors"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="email" 
                    value={company.email} 
                    onChange={e => setCompany(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email"
                    className="w-full text-sm text-gray-500 border-b border-gray-100 focus:border-black outline-none py-1 transition-colors"
                  />
                  <input 
                    type="text" 
                    value={company.phone} 
                    onChange={e => setCompany(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone"
                    className="w-full text-sm text-gray-500 border-b border-gray-100 focus:border-black outline-none py-1 transition-colors"
                  />
                </div>
                <input 
                  type="text" 
                  value={company.website || ''} 
                  onChange={e => setCompany(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="www.yourstudio.com"
                  className="w-full text-sm text-gray-500 border-b border-gray-100 focus:border-black outline-none py-1 transition-colors"
                />
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <User size={12} /> To
                </h3>
                <input 
                  type="text" 
                  value={data.customer.name} 
                  onChange={e => setData(prev => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))}
                  placeholder="Client Name"
                  className="w-full text-xl font-light border-b border-gray-100 focus:border-black outline-none py-2 transition-colors"
                />
                <input 
                  type="text" 
                  value={data.customer.address} 
                  onChange={e => setData(prev => ({ ...prev, customer: { ...prev.customer, address: e.target.value } }))}
                  placeholder="Client Address"
                  className="w-full text-sm text-gray-500 border-b border-gray-100 focus:border-black outline-none py-1 transition-colors"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="email" 
                    value={data.customer.email} 
                    onChange={e => setData(prev => ({ ...prev, customer: { ...prev.customer, email: e.target.value } }))}
                    placeholder="Client Email"
                    className="w-full text-sm text-gray-500 border-b border-gray-100 focus:border-black outline-none py-1 transition-colors"
                  />
                  <input 
                    type="text" 
                    value={data.customer.phone} 
                    onChange={e => setData(prev => ({ ...prev, customer: { ...prev.customer, phone: e.target.value } }))}
                    placeholder="Client Phone"
                    className="w-full text-sm text-gray-500 border-b border-gray-100 focus:border-black outline-none py-1 transition-colors"
                  />
                </div>
              </section>
            </div>

            {/* Items */}
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Items</h3>
                <button onClick={addItem} className="text-gray-400 hover:text-black transition-colors"><Plus size={18} /></button>
              </div>
              <div className="space-y-4">
                {data.items.map(item => (
                  <div key={item.id} className="flex gap-4 items-end group">
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={item.description} 
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full text-sm border-b border-gray-100 focus:border-black outline-none py-2 transition-colors"
                      />
                    </div>
                    <div className="w-16">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full text-sm border-b border-gray-100 focus:border-black outline-none py-2 transition-colors text-center"
                      />
                    </div>
                    <div className="w-24">
                      <input 
                        type="number" 
                        value={item.price} 
                        onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full text-sm border-b border-gray-100 focus:border-black outline-none py-2 transition-colors text-right"
                      />
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-gray-200 hover:text-red-500 transition-colors pb-2 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </section>

            {/* Settings */}
            <section className="space-y-6 pt-6 border-t border-gray-100">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Settings size={12} /> Details
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Number</label>
                  <input 
                    type="text" 
                    value={data.number} 
                    onChange={e => setData(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full text-sm border-b border-gray-100 focus:border-black outline-none py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
                  <input 
                    type="date" 
                    value={data.date} 
                    onChange={e => setData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full text-sm border-b border-gray-100 focus:border-black outline-none py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tax %</label>
                  <input 
                    type="number" 
                    value={data.taxRate} 
                    onChange={e => setData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-sm border-b border-gray-100 focus:border-black outline-none py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Currency</label>
                  <input 
                    type="text" 
                    value={data.currency} 
                    onChange={e => setData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full text-sm border-b border-gray-100 focus:border-black outline-none py-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Notes</label>
                  <textarea 
                    value={data.notes} 
                    onChange={e => setData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={2}
                    className="w-full text-sm border-b border-gray-100 focus:border-black outline-none py-1 resize-none"
                  />
                </div>
                <div className="col-span-2 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                      Payment Link / URL (Optional)
                    </label>
                    <input 
                      type="text" 
                      value={data.paymentLink || ''} 
                      onChange={e => setData(prev => ({ ...prev, paymentLink: e.target.value }))}
                      placeholder="https://pay.me/mystudio"
                      className="w-full text-sm border-b border-gray-100 focus:border-black outline-none py-1"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setData(prev => ({ ...prev, showQr: !prev.showQr }))}
                      className={cn(
                        "w-10 h-5 rounded-full transition-all relative",
                        data.showQr ? "bg-black" : "bg-gray-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                        data.showQr ? "left-6" : "left-1"
                      )} />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Show as QR Code</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Preview Side */}
        <div className="relative">
          <div className="sticky top-12">
            <div 
              ref={previewRef}
              className="bg-white p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-gray-100 w-full aspect-[1/1.41] flex flex-col"
            >
              {/* Preview Header */}
              <div className="flex justify-between items-start mb-20">
                <div>
                  <h2 className="text-4xl font-light tracking-tighter mb-2">{company.name}</h2>
                  <p className="text-xs text-gray-400 max-w-[200px]">{company.address}</p>
                  <div className="text-[10px] text-gray-300 mt-2 space-y-0.5">
                    <p>{company.email} • {company.phone}</p>
                    {company.website && <p>{company.website}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-6xl font-black text-gray-300 uppercase tracking-tighter leading-none mb-4">{data.type}</h3>
                  <div className="text-xs font-medium space-y-1">
                    <p><span className="text-gray-300 uppercase mr-2">No.</span> {data.number}</p>
                    <p><span className="text-gray-300 uppercase mr-2">Date</span> {data.date}</p>
                  </div>
                </div>
              </div>

              {/* Preview Client */}
              <div className="mb-16">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-4">Billed To</p>
                <h4 className="text-xl font-medium mb-1">{data.customer.name}</h4>
                <p className="text-xs text-gray-400 max-w-[240px] mb-2">{data.customer.address}</p>
                <div className="text-[10px] text-gray-300 space-y-0.5">
                  <p>{data.customer.email}</p>
                  <p>{data.customer.phone}</p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="flex-1">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 text-[10px] font-bold uppercase tracking-widest text-gray-300">Description</th>
                      <th className="text-center py-4 text-[10px] font-bold uppercase tracking-widest text-gray-300 w-16">Qty</th>
                      <th className="text-right py-4 text-[10px] font-bold uppercase tracking-widest text-gray-300 w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-6 text-sm font-medium">{item.description || 'Untitled Item'}</td>
                        <td className="py-6 text-sm text-center text-gray-400">{item.quantity}</td>
                        <td className="py-6 text-sm text-right font-medium">{data.currency}{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Preview Footer */}
              <div className="mt-20 pt-12 border-t border-gray-100 flex justify-between items-end gap-4">
                <div className="max-w-[240px] flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-2">Notes</p>
                  <p className="text-xs text-gray-400 italic leading-relaxed">{data.notes}</p>
                </div>

                {data.paymentLink && (
                  <div className="flex flex-col items-center gap-3">
                    {data.showQr && (
                      <div className="p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                        <QRCodeSVG value={data.paymentLink} size={120} level="L" />
                      </div>
                    )}
                    <p className="text-[9px] text-gray-300 break-all font-mono text-center max-w-[150px]">{data.paymentLink}</p>
                  </div>
                )}

                <div className="text-right space-y-3 flex-1">
                  <div className="flex justify-between gap-12 text-xs">
                    <span className="text-gray-300 uppercase font-bold">Subtotal</span>
                    <span className="font-medium">{data.currency}{subtotal.toLocaleString()}</span>
                  </div>
                  {data.taxRate > 0 && (
                    <div className="flex justify-between gap-12 text-xs">
                      <span className="text-gray-300 uppercase font-bold">Tax ({data.taxRate}%)</span>
                      <span className="font-medium">{data.currency}{tax.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-12 pt-4 border-t border-gray-100">
                    <span className="text-sm font-black uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-black">{data.currency}{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-50"
          >
            <CheckCircle2 size={20} className="text-green-400" />
            <span className="text-sm font-medium uppercase tracking-widest">Saved Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          header, .print\\:hidden { display: none !important; }
          main { display: block !important; padding: 0 !important; max-width: none !important; }
          .lg\\:grid-cols-2 { grid-template-columns: 1fr !important; }
          .sticky { position: static !important; }
          .bg-white { box-shadow: none !important; border: none !important; padding: 0 !important; }
        }
      `}} />
    </div>
  );
}
