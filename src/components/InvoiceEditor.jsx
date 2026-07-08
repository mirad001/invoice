import { useState, useRef, useCallback, useMemo } from 'react';
import { Trash2, Printer, FileDown, Plus, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateTotals, formatCurrency, formatDate, newId, newItemId,
  getStartOfMonth, sumInvoices,
} from '../utils/invoiceUtils';
import { DEFAULT_LINE_ITEMS } from '../config/companies';
import Stamp from './Stamp';
import SignaturePanel from './SignaturePanel';

// ─── Per-company invoice visual themes ───────────────────────────────────────
const THEMES = {
  // BCB — dark charcoal header, blue accents, sharp-ish corners
  corporate: {
    darkHeader: true,
    docCls: 'flex-1 bg-white rounded-2xl shadow-invoice overflow-hidden relative min-w-0',
    headerCls: 'bg-brand px-7 pt-7 pb-6',
    logoMark: 'text-accent font-black text-base leading-none',
    coName: 'text-white text-lg font-bold tracking-tight',
    badge: 'w-5 h-5 rounded bg-white/15 flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0',
    badgeText: 'text-slate-400 text-xs',
    invoiceWord: 'text-accent text-3xl font-black tracking-widest mb-4',
    metaLabel: 'text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5',
    metaVal: 'text-slate-300 text-xs font-mono font-semibold',
    input: 'bg-transparent border border-transparent hover:border-white/30 focus:border-accent focus:bg-white/10 outline-none rounded px-1 py-0.5 text-slate-300 text-xs transition-colors w-full placeholder-slate-600',
    sectionLabel: 'text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2',
    box: 'border border-slate-200 rounded-lg p-3 min-h-[90px]',
    theadRow: 'border-b-2 border-slate-900',
    theadTh: 'text-slate-500',
    grandTotal: 'text-accent',
    statsTotal: 'text-accent',
    paidText: 'text-emerald-400',
    pendingText: 'text-amber-300',
  },

  // BCA — #f99a1f header, bold black text throughout
  bold: {
    darkHeader: false,
    docCls: 'flex-1 bg-white rounded-xl shadow-invoice overflow-hidden relative min-w-0',
    headerCls: 'bg-[#f99a1f] px-7 pt-7 pb-6',
    logoMark: 'text-black font-black text-xl leading-none',
    coName: 'text-black text-xl font-black tracking-tight',
    badge: 'w-6 h-6 rounded-lg bg-black flex items-center justify-center text-[10px] font-bold text-[#f99a1f] flex-shrink-0',
    badgeText: 'text-black/80 text-xs font-medium',
    invoiceWord: 'text-black text-4xl font-black tracking-widest mb-4',
    metaLabel: 'text-[9px] font-bold uppercase tracking-widest text-black/50 mb-0.5',
    metaVal: 'text-black text-xs font-bold',
    input: 'bg-black/10 border border-black/25 hover:border-black/50 focus:border-black focus:bg-black/10 outline-none rounded-lg px-2 py-0.5 text-black text-xs transition-colors w-full placeholder-black/35',
    sectionLabel: 'text-[10px] font-bold uppercase tracking-widest text-[#f99a1f] mb-2',
    box: 'border-2 border-[#f99a1f] rounded-xl p-3 min-h-[90px] bg-[#f99a1f]/5',
    theadRow: 'border-b-[3px] border-black',
    theadTh: 'text-black',
    grandTotal: 'text-black',
    statsTotal: 'text-[#f99a1f]',
    paidText: 'text-green-800',
    pendingText: 'text-black',
  },

  // SBC — light green header, very clean & rounded, fresh modern look
  modern: {
    darkHeader: false,
    docCls: 'flex-1 bg-white rounded-3xl shadow-invoice overflow-hidden relative min-w-0',
    headerCls: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-b-4 border-emerald-500 px-7 pt-7 pb-6',
    logoMark: 'text-emerald-600 font-black text-lg leading-none',
    coName: 'text-slate-800 text-lg font-bold tracking-tight',
    badge: 'w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 flex-shrink-0',
    badgeText: 'text-slate-500 text-xs',
    invoiceWord: 'text-emerald-600 text-3xl font-black tracking-[0.2em] mb-4',
    metaLabel: 'text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5',
    metaVal: 'text-slate-700 text-xs font-mono font-semibold',
    input: 'bg-white border border-emerald-200 hover:border-emerald-400 focus:border-emerald-600 outline-none rounded-xl px-2 py-0.5 text-slate-700 text-xs transition-colors w-full placeholder-slate-300',
    sectionLabel: 'text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2',
    box: 'border border-emerald-100 rounded-2xl p-3 min-h-[90px] bg-emerald-50/30',
    theadRow: 'border-b-2 border-emerald-500',
    theadTh: 'text-emerald-700',
    grandTotal: 'text-emerald-600',
    statsTotal: 'text-emerald-500',
    paidText: 'text-emerald-700',
    pendingText: 'text-amber-600',
  },

  // SSS — deep purple gradient, spaced-out letterforms, luxury feel
  premium: {
    darkHeader: true,
    docCls: 'flex-1 bg-white rounded-2xl shadow-invoice overflow-hidden relative min-w-0 ring-1 ring-violet-100',
    headerCls: 'bg-gradient-to-br from-violet-900 to-purple-800 px-7 pt-8 pb-7',
    logoMark: 'text-purple-300 font-semibold text-base leading-none',
    coName: 'text-white text-lg font-semibold tracking-[0.1em]',
    badge: 'w-5 h-5 rounded bg-purple-800/60 flex items-center justify-center text-[10px] font-bold text-purple-200 flex-shrink-0',
    badgeText: 'text-purple-200/80 text-xs',
    invoiceWord: 'text-purple-200 text-3xl font-light tracking-[0.5em] mb-4',
    metaLabel: 'text-[9px] font-semibold uppercase tracking-[0.15em] text-purple-400 mb-0.5',
    metaVal: 'text-purple-100 text-xs font-mono',
    input: 'bg-white/5 border border-purple-700 hover:border-purple-400 focus:border-purple-300 focus:bg-white/10 outline-none rounded px-1 py-0.5 text-white text-xs transition-colors w-full placeholder-purple-500',
    sectionLabel: 'text-[10px] font-semibold uppercase tracking-widest text-violet-400 mb-2',
    box: 'border border-violet-100 rounded-xl p-3 min-h-[90px] bg-violet-50/40',
    theadRow: 'border-b border-violet-200',
    theadTh: 'text-violet-400',
    grandTotal: 'text-violet-700',
    statsTotal: 'text-violet-500',
    paidText: 'text-emerald-300',
    pendingText: 'text-amber-200',
  },

  // MBC — solid teal header, fully rounded everywhere, warm & welcoming
  friendly: {
    darkHeader: true,
    docCls: 'flex-1 bg-white rounded-3xl shadow-invoice overflow-hidden relative min-w-0',
    headerCls: 'bg-teal-500 px-7 pt-8 pb-8',
    logoMark: 'text-white/60 font-black text-lg leading-none',
    coName: 'text-white text-lg font-bold',
    badge: 'w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0',
    badgeText: 'text-teal-100 text-xs',
    invoiceWord: 'text-white text-4xl font-bold tracking-wide mb-4',
    metaLabel: 'text-[9px] font-semibold uppercase tracking-widest text-teal-200 mb-0.5',
    metaVal: 'text-white text-xs font-semibold',
    input: 'bg-white/15 border border-white/25 hover:border-white/50 focus:border-white focus:bg-white/20 outline-none rounded-full px-2 py-0.5 text-white text-xs transition-colors w-full placeholder-teal-200',
    sectionLabel: 'text-[10px] font-bold uppercase tracking-widest text-teal-500 mb-2',
    box: 'border border-teal-100 rounded-2xl p-3 min-h-[90px] bg-teal-50/50',
    theadRow: 'border-b-2 border-teal-300',
    theadTh: 'text-teal-600',
    grandTotal: 'text-teal-600',
    statsTotal: 'text-teal-500',
    paidText: 'text-emerald-200',
    pendingText: 'text-amber-200',
  },
};

function ContactRow({ letter, value, t }) {
  return (
    <div className="flex items-center gap-2">
      <span className={t.badge}>{letter}</span>
      <span className={t.badgeText}>{value}</span>
    </div>
  );
}

function makeInvoice(company, invoiceNumber) {
  const items = DEFAULT_LINE_ITEMS.map(li => ({
    id: newItemId(),
    description: li.description,
    qty: li.qty,
    unitPrice: li.unitPrice,
    total: li.qty * li.unitPrice,
  }));
  const { subtotal, tax, grandTotal } = calculateTotals(items, 0.1);
  const now = new Date().toISOString();
  return {
    id: newId(),
    invoiceNumber,
    companyId: company.id,
    date: now.slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    serviceId: '',
    billTo: { name: '', address: '', email: '', phone: '' },
    bankDetails: company.bankDetails || '',
    lineItems: items,
    subtotal,
    taxRate: 0.1,
    tax,
    grandTotal,
    status: 'pending',
    signatures: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

export default function InvoiceEditor({ companyId, invoiceId, invoiceNumber, setView }) {
  const { companies, invoices, saveInvoice, deleteInvoice, peekAndBumpCounter, peekCounter, currentUser } = useApp();
  const company = companies.find(c => c.id === companyId);
  const invoiceRef = useRef(null);
  const isNew = invoiceId === 'new';

  const t = THEMES[company?.theme || 'corporate'];

  const [invoice, setInvoice] = useState(() =>
    isNew
      ? makeInvoice(company, invoiceNumber)
      : (invoices.find(i => i.id === invoiceId) || null)
  );
  const [isDirty, setIsDirty] = useState(isNew);
  const [saveMsg, setSaveMsg] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const monthStart = getStartOfMonth();
  const companyInvoices = useMemo(
    () => invoices.filter(i => i.companyId === companyId),
    [invoices, companyId]
  );
  const monthInvoices = companyInvoices.filter(i => new Date(i.createdAt) >= monthStart);
  const pendingInvoices = companyInvoices.filter(i => i.status === 'pending');
  const monthTotal = sumInvoices(monthInvoices);

  const nextInvoiceNum = peekCounter(company?.prefix || '');

  const upd = useCallback((fn) => {
    setInvoice(prev => {
      const next = typeof fn === 'function' ? fn(prev) : { ...prev, ...fn };
      return { ...next, updatedAt: new Date().toISOString() };
    });
    setIsDirty(true);
  }, []);

  const updLineItem = (id, field, raw) => {
    upd(prev => {
      const items = prev.lineItems.map(item => {
        if (item.id !== id) return item;
        const upItem = { ...item, [field]: raw };
        if (field === 'qty' || field === 'unitPrice') {
          const q = field === 'qty' ? (parseFloat(raw) || 0) : item.qty;
          const u = field === 'unitPrice' ? (parseFloat(raw) || 0) : item.unitPrice;
          upItem.qty = q;
          upItem.unitPrice = u;
          upItem.total = q * u;
        }
        return upItem;
      });
      const totals = calculateTotals(items, prev.taxRate);
      return { ...prev, lineItems: items, ...totals };
    });
  };

  const addItem = () => {
    upd(prev => {
      const items = [...prev.lineItems, { id: newItemId(), description: '', qty: 1, unitPrice: 0, total: 0 }];
      return { ...prev, lineItems: items, ...calculateTotals(items, prev.taxRate) };
    });
  };

  const removeItem = (id) => {
    upd(prev => {
      const items = prev.lineItems.filter(i => i.id !== id);
      return { ...prev, lineItems: items, ...calculateTotals(items, prev.taxRate) };
    });
  };

  const updTaxRate = (v) => {
    upd(prev => {
      const taxRate = Math.max(0, parseFloat(v) || 0) / 100;
      return { ...prev, taxRate, ...calculateTotals(prev.lineItems, taxRate) };
    });
  };

  const toggleStatus = () => {
    upd(prev => ({ ...prev, status: prev.status === 'paid' ? 'pending' : 'paid' }));
  };

  const handleSign = () => {
    if (!currentUser) return;
    if (invoice.signatures.length >= 5) return;
    if (invoice.signatures.some(s => s.userId === currentUser.id)) return;
    upd(prev => ({
      ...prev,
      signatures: [...prev.signatures, {
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
      }],
    }));
  };

  const doSave = () => {
    saveInvoice(invoice);
    setIsDirty(false);
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const handleSaveNew = () => {
    saveInvoice(invoice);
    const num = peekAndBumpCounter(company.prefix);
    setView({ type: 'invoice', companyId, invoiceId: 'new', invoiceNumber: num });
  };

  const handleDelete = () => {
    if (!isNew && confirm(`Delete ${invoice.invoiceNumber}?`)) {
      deleteInvoice(invoice.id);
    }
    setView({ type: 'company', companyId });
  };

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    if (!invoiceRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      // html2canvas can't render <input>/<textarea> values reliably (text renders
      // clipped/cropped), so capture a detached static copy with fields swapped
      // for plain text instead of the live editable DOM.
      await document.fonts.ready;

      const clone = invoiceRef.current.cloneNode(true);
      const liveFields = invoiceRef.current.querySelectorAll('input, textarea');
      const cloneFields = clone.querySelectorAll('input, textarea');
      cloneFields.forEach((field, i) => {
        const replacement = document.createElement('div');
        replacement.className = field.className;
        replacement.style.whiteSpace = field.tagName === 'TEXTAREA' ? 'pre-wrap' : 'nowrap';
        replacement.style.overflow = 'hidden';
        replacement.textContent = liveFields[i].value;
        field.replaceWith(replacement);
      });
      clone.querySelectorAll('.no-print').forEach(el => el.remove());

      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '-9999px';
      clone.style.margin = '0';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(clone);

      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;

      let y = 0;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(img, 'PNG', 0, -y, pageW, imgH);
        y += pageH;
      }

      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF export failed. Try printing instead.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (!invoice) return (
    <div className="p-10 text-center text-slate-500">Invoice not found.</div>
  );

  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-full bg-slate-100">
      {/* Slim utility bar */}
      <div className="no-print flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex-1 flex items-center gap-1.5">
          {saveMsg ? (
            <span className="text-xs font-semibold text-emerald-600 px-2">{saveMsg}</span>
          ) : isDirty ? (
            <span className="text-xs text-amber-600">Unsaved changes</span>
          ) : null}
        </div>
        <button onClick={handlePrint} title="Print" className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
          <Printer size={15} />
        </button>
        <button onClick={handleExportPDF} title="Download PDF" disabled={pdfLoading} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40">
          {pdfLoading ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
        </button>
        <button onClick={handleDelete} title="Delete" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-0 px-4 py-6 max-w-6xl mx-auto items-start">

        {/* ── INVOICE DOCUMENT ── */}
        {/* Fixed-format document: scrolls horizontally on narrow screens instead of
            squeezing its columns, which was clipping words out of line-item/customer fields. */}
        <div className="w-full overflow-x-auto">
          <div id="invoice-doc" ref={invoiceRef} className={`${t.docCls} min-w-[640px]`}>

          {/* ─── HEADER ─── */}
          <div className={t.headerCls}>
            <div className="flex items-start justify-between gap-6">

              {/* Left: logo + contact */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={t.logoMark}>//</span>
                  <h1 className={t.coName}>{company.name}</h1>
                </div>
                <div className="space-y-1.5">
                  <ContactRow letter="A" value={company.address} t={t} />
                  <ContactRow letter="P" value={company.phone} t={t} />
                  <ContactRow letter="E" value={company.email} t={t} />
                  <ContactRow letter="W" value={company.website} t={t} />
                </div>
              </div>

              {/* Right: INVOICE + meta */}
              <div className="flex-shrink-0 text-right">
                <div className={t.invoiceWord}>INVOICE</div>

                <div className="space-y-3 text-left min-w-[200px]">
                  {/* Invoice # */}
                  <div>
                    <div className={t.metaLabel}>Invoice #</div>
                    <div className={t.metaVal}>{invoice.invoiceNumber}</div>
                  </div>

                  {/* Date */}
                  <div>
                    <div className={t.metaLabel}>Date</div>
                    <input
                      type="date"
                      className={t.input}
                      value={invoice.date}
                      onChange={e => upd({ date: e.target.value })}
                    />
                  </div>

                  {/* Status toggle */}
                  <div>
                    <div className={t.metaLabel}>Status</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleStatus}
                        className={`relative flex items-center h-6 w-12 rounded-full transition-colors duration-300 flex-shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${isPaid ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                      <span className={`text-xs font-bold ${isPaid ? t.paidText : t.pendingText}`}>
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Service ID */}
                  <div>
                    <div className={t.metaLabel}>Service ID</div>
                    <input
                      className={t.input}
                      placeholder="—"
                      value={invoice.serviceId || ''}
                      onChange={e => upd({ serviceId: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CUSTOMER / BANK BOXES ─── */}
          <div className="px-7 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className={t.sectionLabel}>Customer details</div>
              <div className={t.box}>
                <textarea
                  className="inv-textarea h-20"
                  placeholder="Name, address, contact..."
                  value={[
                    invoice.billTo.name,
                    invoice.billTo.address,
                    invoice.billTo.email,
                    invoice.billTo.phone,
                  ].join('\n')}
                  onChange={e => {
                    const [name = '', address = '', email = '', phone = ''] = e.target.value.split('\n');
                    upd(prev => ({ ...prev, billTo: { name, address, email, phone } }));
                  }}
                />
              </div>
            </div>

            <div>
              <div className={t.sectionLabel}>Bank Details</div>
              <div className={t.box}>
                <textarea
                  className="inv-textarea h-20"
                  placeholder="Account Name&#10;BSB&#10;Account No"
                  value={invoice.bankDetails || ''}
                  onChange={e => upd({ bankDetails: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Stamp — positioned relative to invoice doc */}
          <Stamp status={invoice.status} />

          {/* ─── LINE ITEMS ─── */}
          <div className="px-7 pb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className={t.theadRow}>
                  <th className={`text-left pb-2 text-[10px] font-bold uppercase tracking-widest w-1/2 ${t.theadTh}`}>Description</th>
                  <th className={`text-center pb-2 text-[10px] font-bold uppercase tracking-widest w-14 ${t.theadTh}`}>Qty</th>
                  <th className={`text-center pb-2 text-[10px] font-bold uppercase tracking-widest w-6 ${t.theadTh}`}>$</th>
                  <th className={`text-right pb-2 text-[10px] font-bold uppercase tracking-widest w-24 ${t.theadTh}`}>Unit Price</th>
                  <th className={`text-right pb-2 text-[10px] font-bold uppercase tracking-widest w-24 ${t.theadTh}`}>Total</th>
                  <th className="w-7 no-print" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-2 pr-3">
                      <input
                        className="inv-field w-full text-sm px-1 py-0.5 uppercase"
                        value={item.description}
                        placeholder="Description"
                        onChange={e => updLineItem(item.id, 'description', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-1">
                      <input
                        className="inv-field w-full text-center text-sm px-1 py-0.5"
                        type="number"
                        min="0"
                        step="1"
                        value={item.qty}
                        onChange={e => updLineItem(item.id, 'qty', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-1 text-center text-slate-400 text-sm">$</td>
                    <td className="py-2 px-1">
                      <input
                        className="inv-field w-full text-right text-sm px-1 py-0.5"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e => updLineItem(item.id, 'unitPrice', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pl-1 text-right font-semibold text-slate-700 pr-2">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="py-2 no-print">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded hover:bg-red-50 hover:text-red-500 text-slate-300 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={addItem}
              className="no-print mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-dark transition-colors py-1"
            >
              <Plus size={13} />
              + Add Service
            </button>
          </div>

          {/* ─── TOTALS ─── */}
          <div className="px-7 pb-6 mt-4">
            <div className="border-t border-slate-200 pt-4 ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 items-center">
                <span className="flex items-center gap-1">
                  GST
                  <span className="no-print">
                    (<input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="inv-field w-10 text-center text-xs inline-block"
                      value={(invoice.taxRate * 100).toFixed(0)}
                      onChange={e => updTaxRate(e.target.value)}
                    />%)
                  </span>
                  <span className="print-only hidden">({(invoice.taxRate * 100).toFixed(0)}%)</span>
                </span>
                <span className="font-medium">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total (AUD)</span>
                <span className={t.grandTotal}>{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* ─── NOTES ─── */}
          <div className="px-7 pb-6">
            <div className={t.sectionLabel}>Notes</div>
            <textarea
              className="inv-textarea h-16 text-xs"
              placeholder="Payment instructions, terms, or notes…"
              value={invoice.notes}
              onChange={e => upd({ notes: e.target.value })}
            />
          </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="no-print w-full lg:w-72 mt-4 lg:mt-0 lg:ml-4 flex-shrink-0 space-y-4">
          {/* Company stats */}
          <div className="bg-white rounded-2xl shadow-invoice p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              {company.name.toUpperCase()}
            </div>
            <div className={`text-3xl font-black leading-none mb-0.5 ${t.statsTotal}`}>
              {formatCurrency(monthTotal)}
            </div>
            <div className="text-xs text-slate-400 font-medium mb-4">THIS MONTH</div>

            <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Invoices this month</span>
                <span className="font-semibold text-slate-800">{monthInvoices.length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pending</span>
                <span className="font-semibold text-slate-800">{pendingInvoices.length}</span>
              </div>
            </div>
          </div>

          {/* Save actions */}
          <div className="bg-white rounded-2xl shadow-invoice p-5 space-y-3">
            <button
              onClick={handleSaveNew}
              className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              Save &amp; new invoice →
            </button>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Saves this invoice to Records, then opens a blank one as{' '}
              <span className="font-mono text-slate-500">{nextInvoiceNum}</span>.
              Customer boxes stay empty.
            </p>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <button
                onClick={doSave}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl transition-all text-sm"
              >
                {saveMsg || 'Save'}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={pdfLoading}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-accent hover:text-accent text-slate-600 font-semibold py-2 rounded-xl transition-all text-sm disabled:opacity-40"
              >
                {pdfLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                  : <><FileDown size={14} /> Download PDF</>
                }
              </button>
            </div>
          </div>

          {/* Approvals */}
          <div className="bg-white rounded-2xl shadow-invoice p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Approvals</div>
            <SignaturePanel signatures={invoice.signatures} onSign={handleSign} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
