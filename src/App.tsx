import React, { useState, useRef, useEffect } from 'react';
import { CompanyInfo, DocumentData, LineItem } from './types';
import {
  Download,
  Printer,
  Plus,
  Trash2,
  Copy,
  Building,
  User,
  Settings,
  CheckCircle2,
  Truck,
  CreditCard,
  Banknote,
  QrCode,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from './lib/utils';
import { QRCodeSVG } from 'qrcode.react';

/* ─── Defaults ─────────────────────────────────────────────── */
const DEFAULT_COMPANY: CompanyInfo = {
  name: 'Innovus Tech',
  address: '67, Navniman Society, Pratap Nagar,\nNagpur, Maharashtra - 440022\nIndia',
  email: 'hello@innovustech.in',
  phone: '7709501644',
  website: 'www.innovustech.in',
};

// Formato AAAA-MM-DDTHH:mm para el input datetime-local
const getNow = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const INITIAL_DATA: DocumentData = {
  type: 'Invoice',
  number: 'INV-2024-052',
  date: getNow(), // "2024-09-14T15:30"
  purpose: 'Courier Service',
  customer: {
    name: 'Nike Inc.',
    address: 'Nike One Way, Hollywood Blv.,\nLos Angeles, 110022 CA\nUSA',
    email: '',
    phone: '',
  },
  shippedTo: {
    name: 'Nike Inc.',
    address: 'Nike Inc. Hollywood Blv.,\nLos Angeles,\n110022 CA,\nUSA',
    email: '',
    phone: '',
  },
  items: [
    { id: '1', description: 'Website Design', quantity: 1, price: 50 },
    { id: '2', description: 'Website Development', quantity: 1, price: 200 },
    { id: '3', description: 'UX Design', quantity: 1, price: 200 },
    { id: '4', description: 'Website Copywriting', quantity: 1, price: 100 },
  ],
  taxesRate: 0,
  handlingFee: 0,
  handlingFeeType: 'fixed',
  notes: '',
  paymentMethod: 'Cash',
  userTag: 'innovustech@uboi',
  paymentLink: 'upi://pay?pa=dummy&pn=Dummy',
  showQr: true,
};

// Utilities for formatting
const formatMoney = (val: number) => {
  return val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatDateTime = (dtStr: string) => {
    if(!dtStr) return '';
    try {
        const d = new Date(dtStr);
        if (isNaN(d.getTime())) return dtStr;
        const pad = (n: number) => n.toString().padStart(2, '0');
        const m = d.toLocaleString('en-US', { month: 'short' });
        return `${pad(d.getDate())} ${m}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return dtStr;
    }
};

/* ─── Component ─────────────────────────────────────────────── */
export default function App() {
  const [data, setData] = useState<DocumentData>(INITIAL_DATA);
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  /* ── Computed totals ───────────────────────────────────────── */
  const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxesAmount = subtotal * (data.taxesRate / 100);
  const handlingAmount = data.handlingFeeType === 'percentage' ? (subtotal * (data.handlingFee / 100)) : data.handlingFee;
  const total = subtotal + taxesAmount + handlingAmount;

  /* ── Line item helpers ─────────────────────────────────────── */
  const addItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: '',
      quantity: 1,
      price: 0
    };
    setData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    setData((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  /* ── Export Actions ────────────────────────────────────────── */
  const handleExport = async () => {
    if (!previewRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: '#0a0a0a',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.type}_${data.number}.pdf`);
      showToast('PDF Saved Successfully');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToExcel = () => {
    let tsv = "";
    
    // Helper to escape newlines / tabs if needed, but for TSV we'll replace newlines with space to avoid row breaking if it's not wrapped in quotes
    const escape = (str: string | undefined) => (str || "").replace(/\n/g, ", ").replace(/\t/g, " ");

    tsv += `COMPANY\t\n`;
    tsv += `Name:\t${company.name}\n`;
    tsv += `Address:\t${escape(company.address)}\n`;
    tsv += `Email:\t${company.email}\n`;
    tsv += `Phone:\t${company.phone}\n`;
    tsv += `Website:\t${company.website || ''}\n`;
    tsv += `\nINVOICE INFO\t\n`;
    tsv += `Invoice No:\t${data.number}\n`;
    tsv += `Invoice Date:\t${formatDateTime(data.date)}\n`;
    tsv += `Purpose:\t${data.purpose}\n`;
    tsv += `Due Amount:\t$${formatMoney(total)}\n`;
    tsv += `\nINVOICE TO\t\n`;
    tsv += `Name:\t${data.customer.name}\n`;
    tsv += `Address:\t${escape(data.customer.address)}\n`;
    tsv += `\nSHIPPED TO\t\n`;
    tsv += `Name:\t${data.shippedTo.name}\n`;
    tsv += `Address:\t${escape(data.shippedTo.address)}\n`;
    tsv += `\nITEMS\n`;
    tsv += `Description\tQty\tRate\tTotal\n`;
    data.items.forEach(i => {
      const rowTot = i.quantity * i.price;
      tsv += `${escape(i.description)}\t${i.quantity}\t${i.price}\t${rowTot}\n`;
    });
    tsv += `\nTOTALS\n`;
    tsv += `Grand Total:\t${formatMoney(total)}\n`;
    
    navigator.clipboard.writeText(tsv);
    showToast('Copied to Clipboard for Excel/Sheets!');
  };

  /* ─── UI Helpers ──────────────────────────────────────────── */
  const sectionCls = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4";
  const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block";
  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow";
  const textareaCls = cn(inputCls, "resize-y min-h-[80px]");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 print:hidden sticky top-0 bg-[#f8fafc]/90 backdrop-blur-md z-40 border-b border-slate-200/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Facturadora Pro
          </h1>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">
            Studio / Enterprise
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyToExcel}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Copy size={16} />
            Copy for Excel
          </button>
          <button
            onClick={() => window.print()}
            title="Print"
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-slate-600"
          >
            <Printer size={18} />
          </button>
          <button
            onClick={handleExport}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Download size={18} />
            {isGenerating ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </header>

      {/* ── Main Layout ─────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 xl:grid-cols-[1fr,900px] gap-8">
        
        {/* ── Form Section (Left Side) ──────────────────────── */}
        <div className="space-y-6 print:hidden">
          
          <div className="flex gap-2 p-1 bg-slate-200 rounded-lg w-fit">
               {(['Invoice', 'Receipt'] as const).map((t) => (
                 <button
                   key={t}
                   onClick={() => setData((prev) => ({ ...prev, type: t }))}
                   className={cn(
                     'px-6 py-2 rounded-md text-sm font-semibold transition-all',
                     data.type === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
                   )}
                 >
                   {t}
                 </button>
               ))}
          </div>

          <div className={sectionCls}>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Building size={16}/> Company Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <label className={labelCls}>Company Name</label>
                <input type="text" className={inputCls} value={company.name} onChange={(e) => setCompany(p => ({...p, name: e.target.value}))}/>
              </div>
              <div className="col-span-full md:col-span-1">
                <label className={labelCls}>Address</label>
                <textarea className={textareaCls} value={company.address} onChange={(e) => setCompany(p => ({...p, address: e.target.value}))}/>
              </div>
              <div className="col-span-full md:col-span-1 space-y-4">
                 <div>
                    <label className={labelCls}>Email</label>
                    <input type="text" className={inputCls} value={company.email} onChange={(e) => setCompany(p => ({...p, email: e.target.value}))}/>
                 </div>
                 <div>
                    <label className={labelCls}>Phone</label>
                    <input type="text" className={inputCls} value={company.phone} onChange={(e) => setCompany(p => ({...p, phone: e.target.value}))}/>
                 </div>
              </div>
              <div className="col-span-full">
                 <label className={labelCls}>Website</label>
                 <input type="text" className={inputCls} value={company.website || ''} onChange={(e) => setCompany(p => ({...p, website: e.target.value}))}/>
              </div>
            </div>
          </div>

          <div className={sectionCls}>
             <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Settings size={16}/> Document Setup</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div>
                    <label className={labelCls}>Number</label>
                    <input type="text" className={inputCls} value={data.number} onChange={(e) => setData(p => ({...p, number: e.target.value}))}/>
                 </div>
                 <div className="col-span-full md:col-span-1 lg:col-span-2">
                    <label className={labelCls}>Date & Time</label>
                    <div className="flex gap-2">
                       <input type="datetime-local" className={cn(inputCls, 'flex-1')} value={data.date} onChange={(e) => setData(p => ({...p, date: e.target.value}))}/>
                       <button onClick={() => setData(p => ({...p, date: getNow()}))} title="Set to Current Time" className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-lg border border-slate-200 transition-colors flex items-center justify-center shrink-0">
                          <Clock size={16}/>
                       </button>
                    </div>
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={sectionCls}>
                 <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><User size={16}/> Invoice To</h2>
                 <div>
                    <label className={labelCls}>Name</label>
                    <input type="text" className={inputCls} value={data.customer.name} onChange={(e) => setData(p => ({...p, customer: {...p.customer, name: e.target.value}}))}/>
                 </div>
                 <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" className={inputCls} value={data.customer.email || ''} onChange={(e) => setData(p => ({...p, customer: {...p.customer, email: e.target.value}}))}/>
                 </div>
                 <div>
                    <label className={labelCls}>Address</label>
                    <textarea className={textareaCls} value={data.customer.address} onChange={(e) => setData(p => ({...p, customer: {...p.customer, address: e.target.value}}))}/>
                 </div>
              </div>

              <div className={sectionCls}>
                 <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Truck size={16}/> Shipped To</h2>
                 <div>
                    <label className={labelCls}>Name</label>
                    <input type="text" className={inputCls} value={data.shippedTo.name} onChange={(e) => setData(p => ({...p, shippedTo: {...p.shippedTo, name: e.target.value}}))}/>
                 </div>
                 <div>
                    <label className={labelCls}>Address</label>
                    <textarea className={textareaCls} value={data.shippedTo.address} onChange={(e) => setData(p => ({...p, shippedTo: {...p.shippedTo, address: e.target.value}}))}/>
                 </div>
              </div>
          </div>

          <div className={sectionCls}>
             <div className="flex justify-between items-center mb-2">
                 <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">Items</h2>
                 <button onClick={addItem} className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={16}/> Add Row
                 </button>
             </div>
             
             <div className="overflow-x-auto w-full">
                <table className="w-full text-left min-w-[600px]">
                   <thead>
                      <tr className="border-b border-slate-200">
                         <th className="py-2 text-xs font-semibold text-slate-500 uppercase">Desc</th>
                         <th className="py-2 text-xs font-semibold text-slate-500 uppercase w-20">Qty</th>
                         <th className="py-2 text-xs font-semibold text-slate-500 uppercase w-32">Rate</th>
                         <th className="py-2 w-8"></th>
                      </tr>
                   </thead>
                   <tbody>
                      <AnimatePresence initial={false}>
                        {data.items.map((item) => (
                           <motion.tr 
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="border-b border-slate-100 last:border-0 group"
                           >
                              <td className="py-2 pr-2"><input type="text" className={inputCls} value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)}/></td>
                              <td className="py-2 px-1"><input type="number" min={1} className={cn(inputCls,"px-2 text-center")} value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}/></td>
                              <td className="py-2 px-1"><input type="number" min={0} className={cn(inputCls,"px-2 text-right")} value={item.price} onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}/></td>
                              <td className="py-2 pl-2">
                                 <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                    <Trash2 size={16}/>
                                 </button>
                              </td>
                           </motion.tr>
                        ))}
                      </AnimatePresence>
                   </tbody>
                </table>
             </div>
             
             <div className="flex flex-col md:flex-row gap-4 mt-2 pt-4 border-t border-slate-100">
                 <div className="flex-1">
                    <label className={labelCls}>Taxes (%)</label>
                    <div className="relative">
                       <input type="number" min={0} className={cn(inputCls, "pr-7")} value={data.taxesRate} onChange={(e) => setData(p => ({...p, taxesRate: parseFloat(e.target.value) || 0}))}/>
                       <span className="absolute right-3 top-2.5 text-slate-400 font-semibold">%</span>
                    </div>
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                       <label className={labelCls + " mb-0"}>Handling & Transport</label>
                       <select className="text-xs bg-slate-100 border text-slate-600 border-slate-200 rounded px-2 py-0.5 outline-none cursor-pointer" value={data.handlingFeeType} onChange={(e) => setData(p => ({...p, handlingFeeType: e.target.value as 'fixed' | 'percentage'}))}>
                          <option value="fixed">Fixed ($)</option>
                          <option value="percentage">%</option>
                       </select>
                    </div>
                    <div className="relative">
                       {data.handlingFeeType === 'fixed' && <span className="absolute left-3 top-2.5 text-slate-400 font-semibold">$</span>}
                       <input type="number" min={0} className={cn(inputCls, data.handlingFeeType === 'fixed' ? 'pl-7' : 'pr-7')} value={data.handlingFee} onChange={(e) => setData(p => ({...p, handlingFee: parseFloat(e.target.value) || 0}))}/>
                       {data.handlingFeeType === 'percentage' && <span className="absolute right-3 top-2.5 text-slate-400 font-semibold">%</span>}
                    </div>
                 </div>
              </div>
          </div>

          <div className={sectionCls}>
             <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Banknote size={16}/> Payment Info</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                    <label className={labelCls}>Purpose (e.g. Courier Service)</label>
                    <input type="text" className={inputCls} value={data.purpose} onChange={(e) => setData(p => ({...p, purpose: e.target.value}))}/>
                 </div>
                <div>
                   <label className={labelCls}>Payment Method</label>
                   <input type="text" className={inputCls} value={data.paymentMethod} onChange={(e) => setData(p => ({...p, paymentMethod: e.target.value}))}/>
                </div>
                <div className="col-span-full md:col-span-1">
                   <label className={labelCls}>User Tag</label>
                   <input type="text" className={inputCls} value={data.userTag || ''} onChange={(e) => setData(p => ({...p, userTag: e.target.value}))}/>
                </div>
                <div className="col-span-full md:col-span-1">
                   <label className={labelCls}>User Profile Link (QR)</label>
                   <input type="text" className={inputCls} value={data.paymentLink || ''} onChange={(e) => setData(p => ({...p, paymentLink: e.target.value}))}/>
                </div>
                <div className="col-span-full">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                     <button
                        role="switch"
                        aria-checked={data.showQr}
                        onClick={() => setData((p) => ({ ...p, showQr: !p.showQr }))}
                        className={cn(
                           'w-11 h-6 rounded-full transition-colors relative focus:outline-none ring-2 ring-transparent',
                           data.showQr ? 'bg-slate-900' : 'bg-slate-300',
                        )}
                     >
                        <span
                           className={cn(
                           'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                           data.showQr ? 'left-[22px]' : 'left-1',
                           )}
                        />
                     </button>
                     <span className={labelCls + " mb-0"}>Show QR Code on Invoice</span>
                  </label>
                </div>
             </div>
          </div>
        </div>

        {/* ── Preview Column (Fixed Dimensions wrapper to ensure alignment never breaks) ──────────────── */}
        <div className="flex flex-col items-center">
            <div className="w-full overflow-x-auto rounded-lg shadow-xl ring-1 ring-slate-200 hide-scrollbar bg-slate-900 print:shadow-none print:ring-0 print:overflow-visible flex justify-center">
               <div 
                  ref={previewRef}
                  /* Flex basis allows the content to stretch beyond fixed height if it really needs to, preventing cutoff */
                  className="w-[800px] min-h-[1131px] bg-[#0a0a0a] text-[#f1f1f1] font-sans antialiased p-12 flex flex-col relative tracking-wide shrink-0"
               >
                  {/* Top Header Grid */}
                  <div className="flex justify-between items-start mb-14">
                      <h1 className="text-4xl font-bold tracking-tighter text-white font-sans whitespace-pre-wrap">{company.name.toUpperCase()}</h1>
                      <h2 className="text-3xl font-bold tracking-widest text-[#f1f1f1] uppercase shrink-0">{data.type}</h2>
                  </div>

                  {/* Top Company Info */}
                  <div className="flex justify-between items-start text-sm mb-12 text-[#b0b0b0] leading-relaxed w-[85%]">
                     <div className="flex-1 whitespace-pre-wrap">
                        <span className="font-semibold text-white mb-1 block">{company.name}</span>
                        {company.address}
                     </div>
                     <div className="flex-1">
                        <span className="font-semibold text-white mb-1 block">Contact</span>
                        {company.website && <p>{company.website}</p>}
                        {company.phone && <p>{company.phone}</p>}
                        {company.email && <p>{company.email}</p>}
                     </div>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] bg-[#333] w-full mb-6 relative"></div>

                  <div className="flex justify-between mb-8 text-sm gap-4">
                     <div className="flex-1">
                        <p className="font-semibold text-white mb-2 text-[13px]">Due Amount</p>
                        <p className="text-[#d0d0d0]">${formatMoney(total)}</p>
                     </div>
                     <div className="flex-[1.5]">
                        <p className="font-semibold text-white mb-2 text-[13px]">Invoice Date</p>
                        <p className="text-[#d0d0d0] whitespace-nowrap">{formatDateTime(data.date)}</p>
                     </div>
                     <div className="flex-1">
                        <p className="font-semibold text-white mb-2 text-[13px]">Invoice #</p>
                        <p className="text-[#d0d0d0]">{data.number}</p>
                     </div>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] bg-[#333] w-full mb-6"></div>

                  <div className="flex mb-12 text-sm leading-relaxed text-[#b0b0b0] gap-4">
                     <div className="w-1/2 pr-6">
                        <p className="font-semibold text-white mb-2 text-[13px]">Invoice To</p>
                        <p className="font-semibold text-white">{data.customer.name}</p>
                        {data.customer.email && <p className="text-white mt-0.5">{data.customer.email}</p>}
                        <p className="whitespace-pre-wrap mt-0.5">{data.customer.address}</p>
                     </div>
                     <div className="w-1/2 pr-6">
                        <p className="font-semibold text-white mb-2 text-[13px]">Shipped To</p>
                        <p className="font-semibold text-white">{data.shippedTo.name}</p>
                        <p className="whitespace-pre-wrap mt-0.5">{data.shippedTo.address}</p>
                     </div>
                  </div>

                  {/* Items Table */}
                  <div className="w-full flex-1">
                     <table className="w-full text-[13px] text-left border-collapse">
                        <thead>
                           <tr className="border-y border-[#333] text-white">
                              <th className="py-3 font-semibold w-8">#</th>
                              <th className="py-3 font-semibold">Desc. of Goods/Services</th>
                              <th className="py-3 font-semibold text-center w-20">Qty.</th>
                              <th className="py-3 font-semibold text-right">Rate ($)</th>
                              <th className="py-3 font-semibold text-right">Total ($)</th>
                           </tr>
                        </thead>
                        <tbody className="text-[#d0d0d0]">
                           {data.items.map((item, index) => {
                              const rowTot = (item.quantity * item.price);
                              return (
                                 <tr key={item.id} className="border-b border-[#222]">
                                    <td className="py-3 align-top">{index + 1}</td>
                                    <td className="py-3 pr-2 align-top">{item.description}</td>
                                    <td className="py-3 text-center align-top">{item.quantity.toFixed(1)} {item.description.toLowerCase().includes('design') || item.description.toLowerCase().includes('development') ? 'U' : ''}</td>
                                    <td className="py-3 text-right align-top">{formatMoney(item.price)}</td>
                                    <td className="py-3 text-right align-top text-white">{formatMoney(rowTot)}</td>
                                 </tr>
                              )
                           })}
                        </tbody>
                     </table>
                  </div>

                  {/* Totals & Notes Section */}
                  <div className="mt-8 flex justify-between text-[13px] pb-12">
                      <div className="w-[60%] flex gap-8">
                         <div>
                            <p className="font-semibold text-white mb-2">Payment Method</p>
                            <p className="text-[#b0b0b0]">{data.paymentMethod}</p>
                            {data.userTag && (
                               <p className="text-[#b0b0b0] mt-1"><span className="text-white font-semibold">User:</span> {data.userTag}</p>
                            )}
                         </div>
                         {data.showQr && data.paymentLink && (
                             <div className="bg-white p-2 shrink-0 rounded-sm w-fit h-fit">
                                 <QRCodeSVG value={data.paymentLink} size={64} level="L" marginSize={0} />
                             </div>
                         )}
                         <div>
                            <p className="font-semibold text-white mb-2">Purpose</p>
                            <p className="text-[#b0b0b0] max-w-[200px] whitespace-pre-wrap">{data.purpose}</p>
                         </div>
                      </div>
                      
                      <div className="w-[45%] ml-auto max-w-[280px]">
                         {taxesAmount > 0 || handlingAmount > 0 ? (
                            <>
                               <div className="flex justify-between py-2 text-[#b0b0b0]">
                                   <span>Subtotal</span>
                                   <span>${formatMoney(subtotal)}</span>
                               </div>
                               {taxesAmount > 0 && (
                                  <div className="flex justify-between py-2 text-[#b0b0b0]">
                                      <span>Taxes ({data.taxesRate}%)</span>
                                      <span>${formatMoney(taxesAmount)}</span>
                                  </div>
                               )}
                               {handlingAmount > 0 && (
                                  <div className="flex justify-between py-2 text-[#b0b0b0]">
                                      <span>Handling & Transport</span>
                                      <span>${formatMoney(handlingAmount)}</span>
                                  </div>
                               )}
                            </>
                         ) : null}
                         <div className="flex justify-between py-3 border-b border-[#333] text-base font-semibold text-white mt-1">
                             <span>Total</span>
                             <span>${formatMoney(total)}</span>
                         </div>
                      </div>
                  </div>
               </div>
            </div>
            
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-6 pb-12 print:hidden">
              Responsive Preview Area 
            </p>
        </div>
      </main>

      {/* ── Success toast ────────────────────────────────────── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-50 print:hidden"
          >
            <CheckCircle2 size={20} className="text-emerald-400" />
            <span className="text-sm font-semibold tracking-wide">
              {toastMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* Custom scrollbar to hide it structurally */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        @media print {
          body {
            background-color: white;
          }
          .print\\:hidden { display: none !important; }
          main { display: block !important; padding: 0 !important; max-width: none !important; margin: 0 !important; }
          .xl\\:grid-cols-\\[1fr\\,900px\\] { display: block !important; }
        }
      `}</style>
    </div>
  );
}
