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

// ─── Invoice templates ────────────────────────────────────────────────────
// Three curated designs. Every company picks one (persisted per-company via
// company.invoiceTemplate) instead of getting a fixed look. Each accents with
// the company's own --accent colour; only the neutral/background differs.
export const TEMPLATES = {
  minimal: {
    name: 'Modern Minimal',
    description: 'White header, thin rule, generous whitespace',
    swatchCls: 'bg-white border border-slate-200',
    darkHeader: false,
    docCls: 'flex-1 bg-white rounded-2xl shadow-invoice overflow-hidden relative min-w-0',
    headerCls: 'bg-white px-8 pt-8 pb-6 border-b border-slate-200',
    logoMark: 'text-accent font-bold text-sm leading-none',
    coName: 'text-slate-900 text-xl font-bold tracking-tight',
    badge: 'w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0',
    badgeText: 'text-slate-500 text-xs',
    invoiceWord: 'text-accent text-[11px] font-bold uppercase tracking-[0.25em] mb-3',
    metaLabel: 'text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1',
    metaVal: 'text-slate-800 text-sm font-semibold',
    input: 'bg-slate-50 border border-slate-200 hover:border-accent/50 focus:border-accent focus:bg-white outline-none rounded-lg px-2.5 py-1.5 text-slate-800 text-sm transition-colors w-full placeholder-slate-300',
    sectionLabel: 'text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2',
    box: 'border border-slate-200 rounded-xl p-4 min-h-[90px] bg-slate-50/50',
    theadRow: 'border-b-2 border-slate-800',
    theadTh: 'text-slate-500',
    grandTotal: 'text-accent',
    statsTotal: 'text-accent',
    paidText: 'text-emerald-600',
    pendingText: 'text-amber-600',
  },

  corporate: {
    name: 'Bold Corporate',
    description: 'Solid dark-neutral header, confident and formal',
    swatchCls: 'bg-brand',
    darkHeader: true,
    docCls: 'flex-1 bg-white rounded-xl shadow-invoice overflow-hidden relative min-w-0',
    headerCls: 'bg-brand px-8 pt-8 pb-6',
    logoMark: 'text-accent-light font-bold text-sm leading-none',
    coName: 'text-white text-xl font-bold tracking-tight',
    badge: 'w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/70 flex-shrink-0',
    badgeText: 'text-white/60 text-xs',
    invoiceWord: 'text-accent-light text-[11px] font-bold uppercase tracking-[0.25em] mb-3',
    metaLabel: 'text-[9px] font-semibold uppercase tracking-widest text-white/40 mb-1',
    metaVal: 'text-white text-sm font-semibold',
    input: 'bg-white/10 border border-white/15 hover:border-white/30 focus:border-accent-light focus:bg-white/15 outline-none rounded-lg px-2.5 py-1.5 text-white text-sm transition-colors w-full placeholder-white/30',
    sectionLabel: 'text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2',
    box: 'border border-slate-200 rounded-lg p-4 min-h-[90px]',
    theadRow: 'border-b-2 border-brand',
    theadTh: 'text-slate-600',
    grandTotal: 'text-accent-dark',
    statsTotal: 'text-accent',
    paidText: 'text-emerald-600',
    pendingText: 'text-amber-600',
  },

  soft: {
    name: 'Soft Professional',
    description: 'Gentle tinted header, rounded, understated',
    swatchCls: 'bg-accent/10 border border-accent/20',
    darkHeader: false,
    docCls: 'flex-1 bg-white rounded-2xl shadow-invoice overflow-hidden relative min-w-0 ring-1 ring-slate-100',
    headerCls: 'bg-accent/5 px-8 pt-8 pb-6 border-b border-accent/10',
    logoMark: 'text-accent font-bold text-sm leading-none',
    coName: 'text-slate-800 text-xl font-semibold tracking-tight',
    badge: 'w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent-dark flex-shrink-0',
    badgeText: 'text-slate-500 text-xs',
    invoiceWord: 'text-accent text-[11px] font-bold uppercase tracking-[0.25em] mb-3',
    metaLabel: 'text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1',
    metaVal: 'text-slate-700 text-sm font-semibold',
    input: 'bg-white border border-accent/20 hover:border-accent/40 focus:border-accent outline-none rounded-lg px-2.5 py-1.5 text-slate-700 text-sm transition-colors w-full placeholder-slate-300',
    sectionLabel: 'text-[10px] font-bold uppercase tracking-widest text-accent-dark mb-2',
    box: 'border border-accent/15 rounded-xl p-4 min-h-[90px] bg-accent/5',
    theadRow: 'border-b-2 border-accent/30',
    theadTh: 'text-accent-dark',
    grandTotal: 'text-accent-dark',
    statsTotal: 'text-accent',
    paidText: 'text-emerald-600',
    pendingText: 'text-amber-600',
  },
};

export const TEMPLATE_LIST = Object.entries(TEMPLATES).map(([id, t]) => ({
  id, name: t.name, description: t.description, swatchCls: t.swatchCls,
}));

const THEMES = TEMPLATES;

function ContactRow({ letter, value, t }) {
  if (!value) return null;
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

  const t = THEMES[company?.invoiceTemplate] || THEMES.minimal;

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
        const liveField = liveFields[i];
        const replacement = document.createElement('div');
        replacement.className = field.className;
        replacement.style.whiteSpace = field.tagName === 'TEXTAREA' ? 'pre-wrap' : 'nowrap';
        replacement.style.overflow = 'hidden';
        // Native date inputs display as DD/MM/YYYY on screen, but .value is
        // always ISO (YYYY-MM-DD) — reformat so the export matches what's shown.
        if (liveField.type === 'date' && liveField.value) {
          const [yyyy, mm, dd] = liveField.value.split('-');
          replacement.textContent = `${dd}/${mm}/${yyyy}`;
        } else {
          replacement.textContent = liveField.value;
        }
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

      // Always fit on a single page — scale the whole invoice down rather
      // than splitting it across pages, which broke the layout on page 2.
      const imgRatio = canvas.height / canvas.width;
      let drawW = pageW;
      let drawH = drawW * imgRatio;
      if (drawH > pageH) {
        drawH = pageH;
        drawW = drawH / imgRatio;
      }
      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;
      pdf.addImage(img, 'PNG', x, y, drawW, drawH);

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

                {/* Grid guarantees each field its own row/column — never overlaps,
                    regardless of content length or native input chrome height. */}
                <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-left min-w-[220px]">
                  {/* Invoice # — full width, primary identifier */}
                  <div className="col-span-2">
                    <div className={t.metaLabel}>Invoice #</div>
                    <div className={`${t.metaVal} min-h-[34px] flex items-center`}>{invoice.invoiceNumber}</div>
                  </div>

                  {/* Date */}
                  <div>
                    <div className={t.metaLabel}>Date</div>
                    <input
                      type="date"
                      className={`${t.input} min-h-[34px]`}
                      value={invoice.date}
                      onChange={e => upd({ date: e.target.value })}
                    />
                  </div>

                  {/* Status toggle — horizontally aligned with Date */}
                  <div>
                    <div className={t.metaLabel}>Status</div>
                    <div className="flex items-center gap-2 min-h-[34px]">
                      <button
                        onClick={toggleStatus}
                        className={`relative flex items-center h-6 w-12 rounded-full transition-colors duration-300 flex-shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${isPaid ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                      <span className={`text-xs font-bold leading-none whitespace-nowrap ${isPaid ? t.paidText : t.pendingText}`}>
                        {isPaid ? 'PAID' : 'UNPAID'}
                      </span>
                    </div>
                  </div>

                  {/* Service ID — full width */}
                  <div className="col-span-2">
                    <div className={t.metaLabel}>Service ID</div>
                    <input
                      className={`${t.input} min-h-[34px]`}
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
          <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
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
          <div className="px-8 pb-2">
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
          <div className="px-8 pb-6 mt-4">
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
          <div className="px-8 pb-8">
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
