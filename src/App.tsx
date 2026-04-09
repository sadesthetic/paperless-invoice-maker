import React, { useState, useRef } from 'react';
import { CompanyInfo, DocumentData, LineItem } from './types';
import {
  Download,
  Printer,
  Plus,
  Trash2,
  Building,
  User,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from './lib/utils';
import { QRCodeSVG } from 'qrcode.react';

/* ─── Defaults ─────────────────────────────────────────────── */
const DEFAULT_COMPANY: CompanyInfo = {
  name: 'My Studio',
  address: '123 Creative Ave, Design City',
  email: 'hello@mystudio.com',
  phone: '+1 (555) 000-1111',
  website: 'www.mystudio.com',
};

const INITIAL_DATA: DocumentData = {
  type: 'Invoice',
  number: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  customer: {
    name: 'John Doe',
    address: '456 Client St, Business Town',
    email: 'john@example.com',
    phone: '+1 (555) 222-3333',
  },
  items: [
    { id: '1', description: 'Brand Identity Design', quantity: 1, price: 1200 },
    { id: '2', description: 'Website Development', quantity: 1, price: 2500 },
  ],
  currency: '$',
  notes: 'Thank you for your business!',
  taxRate: 0,
  paymentLink: 'https://pay.me/mystudio',
  showQr: true,
};

/* ─── Component ─────────────────────────────────────────────── */
export default function App() {
  const [data, setData] = useState<DocumentData>(INITIAL_DATA);
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  /* ── Computed totals ───────────────────────────────────────── */
  const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * (data.taxRate / 100);
  const total = subtotal + tax;

  /* ── Line item helpers ─────────────────────────────────────── */
  const addItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      price: 0,
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

  /* ── PDF Export ────────────────────────────────────────────── */
  const handleExport = async () => {
    if (!previewRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.type}_${data.number}.pdf`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  /* ─── Field style shorthand ───────────────────────────────── */
  const fieldCls = 'w-full border-b border-gray-100 focus:border-black outline-none py-1.5 transition-colors bg-transparent';

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-black selection:text-white">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="max-w-5xl mx-auto px-6 py-10 flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-black">Paperless</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
            Minimalist {data.type} Maker
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            title="Print"
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
            {isGenerating ? 'Saving…' : 'Export PDF'}
          </button>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16">

        {/* ─── Form Column ────────────────────────────────── */}
        <div className="space-y-12 print:hidden">

          {/* Document type toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            {(['Invoice', 'Receipt'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setData((prev) => ({ ...prev, type: t }))}
                className={cn(
                  'px-6 py-2 rounded-lg text-sm font-medium transition-all',
                  data.type === t ? 'bg-white shadow-sm text-black' : 'text-gray-500',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-10">
            {/* ─ From (Company) ─ */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Building size={12} /> From
              </h3>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your Name / Studio"
                className={cn(fieldCls, 'text-xl font-light')}
              />
              <input
                type="text"
                value={company.address}
                onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))}
                placeholder="Address"
                className={cn(fieldCls, 'text-sm text-gray-500')}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email"
                  className={cn(fieldCls, 'text-sm text-gray-500')}
                />
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone"
                  className={cn(fieldCls, 'text-sm text-gray-500')}
                />
              </div>
              <input
                type="text"
                value={company.website ?? ''}
                onChange={(e) => setCompany((p) => ({ ...p, website: e.target.value }))}
                placeholder="www.yourstudio.com"
                className={cn(fieldCls, 'text-sm text-gray-500')}
              />
            </section>

            {/* ─ To (Customer) ─ */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <User size={12} /> To
              </h3>
              <input
                type="text"
                value={data.customer.name}
                onChange={(e) =>
                  setData((p) => ({ ...p, customer: { ...p.customer, name: e.target.value } }))
                }
                placeholder="Client Name"
                className={cn(fieldCls, 'text-xl font-light')}
              />
              <input
                type="text"
                value={data.customer.address}
                onChange={(e) =>
                  setData((p) => ({ ...p, customer: { ...p.customer, address: e.target.value } }))
                }
                placeholder="Client Address"
                className={cn(fieldCls, 'text-sm text-gray-500')}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="email"
                  value={data.customer.email}
                  onChange={(e) =>
                    setData((p) => ({ ...p, customer: { ...p.customer, email: e.target.value } }))
                  }
                  placeholder="Client Email"
                  className={cn(fieldCls, 'text-sm text-gray-500')}
                />
                <input
                  type="text"
                  value={data.customer.phone}
                  onChange={(e) =>
                    setData((p) => ({ ...p, customer: { ...p.customer, phone: e.target.value } }))
                  }
                  placeholder="Client Phone"
                  className={cn(fieldCls, 'text-sm text-gray-500')}
                />
              </div>
            </section>

            {/* ─ Line Items ─ */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Items
                </h3>
                <button
                  onClick={addItem}
                  title="Add item"
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Column headers */}
              <div className="flex gap-4 items-center text-[10px] font-bold uppercase tracking-widest text-gray-300 px-0">
                <span className="flex-1">Description</span>
                <span className="w-16 text-center">Qty</span>
                <span className="w-24 text-right">Price</span>
                <span className="w-6" />
              </div>

              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {data.items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-4 items-center group overflow-hidden"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Description"
                          className={cn(fieldCls, 'text-sm')}
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)
                          }
                          className={cn(fieldCls, 'text-sm text-center')}
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, 'price', parseFloat(e.target.value) || 0)
                          }
                          className={cn(fieldCls, 'text-sm text-right')}
                        />
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        title="Remove item"
                        className="w-6 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>

            {/* ─ Details ─ */}
            <section className="space-y-6 pt-6 border-t border-gray-100">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Settings size={12} /> Details
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Number
                  </label>
                  <input
                    type="text"
                    value={data.number}
                    onChange={(e) => setData((p) => ({ ...p, number: e.target.value }))}
                    className={cn(fieldCls, 'text-sm')}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => setData((p) => ({ ...p, date: e.target.value }))}
                    className={cn(fieldCls, 'text-sm')}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Tax %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={data.taxRate}
                    onChange={(e) =>
                      setData((p) => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))
                    }
                    className={cn(fieldCls, 'text-sm')}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={data.currency}
                    maxLength={3}
                    onChange={(e) => setData((p) => ({ ...p, currency: e.target.value }))}
                    className={cn(fieldCls, 'text-sm')}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Notes
                  </label>
                  <textarea
                    value={data.notes}
                    onChange={(e) => setData((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Additional notes…"
                    rows={2}
                    className={cn(
                      fieldCls,
                      'text-sm resize-none border-b border-gray-100 focus:border-black',
                    )}
                  />
                </div>

                {/* Payment link + QR toggle */}
                <div className="col-span-2 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Payment Link / URL (optional)
                    </label>
                    <input
                      type="url"
                      value={data.paymentLink ?? ''}
                      onChange={(e) => setData((p) => ({ ...p, paymentLink: e.target.value }))}
                      placeholder="https://pay.me/yourstudio"
                      className={cn(fieldCls, 'text-sm')}
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      role="switch"
                      aria-checked={data.showQr}
                      onClick={() => setData((p) => ({ ...p, showQr: !p.showQr }))}
                      className={cn(
                        'w-10 h-5 rounded-full transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-black',
                        data.showQr ? 'bg-black' : 'bg-gray-200',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-1 w-3 h-3 rounded-full bg-white transition-all',
                          data.showQr ? 'left-6' : 'left-1',
                        )}
                      />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Show as QR Code
                    </span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ─── Preview Column ──────────────────────────────── */}
        <div className="relative">
          <div className="sticky top-10">
            <div
              ref={previewRef}
              className="bg-white p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-gray-100 w-full aspect-[1/1.41] flex flex-col overflow-hidden"
            >
              {/* Preview — header */}
              <div className="flex justify-between items-start mb-16">
                <div>
                  <h2 className="text-3xl font-light tracking-tighter mb-1">{company.name}</h2>
                  <p className="text-xs text-gray-400 max-w-[200px]">{company.address}</p>
                  <div className="text-[10px] text-gray-300 mt-1.5 space-y-0.5">
                    <p>
                      {company.email} · {company.phone}
                    </p>
                    {company.website && <p>{company.website}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-5xl font-black text-gray-200 uppercase tracking-tighter leading-none mb-3">
                    {data.type}
                  </h3>
                  <div className="text-xs font-medium space-y-1">
                    <p>
                      <span className="text-gray-300 uppercase mr-2">No.</span>
                      {data.number}
                    </p>
                    <p>
                      <span className="text-gray-300 uppercase mr-2">Date</span>
                      {data.date}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview — billed to */}
              <div className="mb-12">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-3">
                  Billed To
                </p>
                <h4 className="text-lg font-semibold mb-0.5">{data.customer.name}</h4>
                <p className="text-xs text-gray-400 max-w-[240px] mb-1.5">
                  {data.customer.address}
                </p>
                <div className="text-[10px] text-gray-300 space-y-0.5">
                  <p>{data.customer.email}</p>
                  <p>{data.customer.phone}</p>
                </div>
              </div>

              {/* Preview — items table */}
              <div className="flex-1 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                        Description
                      </th>
                      <th className="text-center pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-300 w-12">
                        Qty
                      </th>
                      <th className="text-right pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-300 w-28">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 text-sm font-medium">
                          {item.description || 'Untitled Item'}
                        </td>
                        <td className="py-4 text-sm text-center text-gray-400">{item.quantity}</td>
                        <td className="py-4 text-sm text-right font-medium">
                          {data.currency}
                          {(item.price * item.quantity).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Preview — footer */}
              <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-end gap-6">
                {/* Notes — takes most of the space */}
                <div className="flex-[2] min-w-0">
                  {data.notes && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">
                        Notes
                      </p>
                      <p className="text-[10px] text-gray-400 italic leading-relaxed">
                        {data.notes}
                      </p>
                    </>
                  )}
                </div>

                {/* QR code */}
                {data.paymentLink && (
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {data.showQr && (
                      <div className="p-2.5 border border-gray-100 rounded-xl bg-white shadow-sm">
                        <QRCodeSVG value={data.paymentLink} size={80} level="L" />
                      </div>
                    )}
                    <p className="text-[8px] text-gray-300 break-all font-mono text-center max-w-[110px]">
                      {data.paymentLink}
                    </p>
                  </div>
                )}

                {/* Totals — compact, fixed width */}
                <div className="text-right space-y-1.5 shrink-0">
                  <div className="flex justify-between gap-6 text-[10px]">
                    <span className="text-gray-300 uppercase font-bold">Subtotal</span>
                    <span className="font-medium">
                      {data.currency}
                      {subtotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {data.taxRate > 0 && (
                    <div className="flex justify-between gap-6 text-[10px]">
                      <span className="text-gray-300 uppercase font-bold">
                        Tax ({data.taxRate}%)
                      </span>
                      <span className="font-medium">
                        {data.currency}
                        {tax.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between gap-6 pt-2 border-t border-gray-100">
                    <span className="text-xs font-black uppercase tracking-widest">Total</span>
                    <span className="text-sm font-black">
                      {data.currency}
                      {total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-300 text-center mt-4 tracking-widest uppercase">
              Live preview · Export as PDF
            </p>
          </div>
        </div>
      </main>

      {/* ── Success toast ────────────────────────────────────── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-50"
          >
            <CheckCircle2 size={20} className="text-green-400" />
            <span className="text-sm font-medium uppercase tracking-widest">
              Saved Successfully
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Print styles ─────────────────────────────────────── */}
      <style>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          main { display: block !important; padding: 0 !important; max-width: none !important; }
          .lg\\:grid-cols-2 { grid-template-columns: 1fr !important; }
          .sticky { position: static !important; }
          .bg-white { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
