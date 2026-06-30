import { useState, useRef, useCallback, useMemo } from 'react';
import { Trash2, Printer, FileDown, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateTotals, formatCurrency, formatDate, newId, newItemId,
  getStartOfMonth, sumInvoices,
} from '../utils/invoiceUtils';
import { DEFAULT_LINE_ITEMS } from '../config/companies';
import Stamp from './Stamp';
import SignaturePanel from './SignaturePanel';

function ContactRow({ letter, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 rounded bg-white/15 flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0">
        {letter}
      </span>
      <span className="text-slate-400 text-xs">{value}</span>
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
    teamCode: '',
    billTo: { name: '', address: '', email: '', phone: '' },
    clientDetails: { name: '', address: '' },
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

  const [invoice, setInvoice] = useState(() =>
    isNew
      ? makeInvoice(company, invoiceNumber)
      : (invoices.find(i => i.id === invoiceId) || null)
  );
  const [isDirty, setIsDirty] = useState(isNew);
  const [saveMsg, setSaveMsg] = useState('');

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
    if (!invoiceRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, logging: false });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, 'PNG', 0, 0, w, h);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF export failed. Try printing instead.');
    }
  };

  if (!invoice) return (
    <div className="p-10 text-center text-slate-500">Invoice not found.</div>
  );

  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-full bg-slate-100">
      {/* Slim print/utility bar */}
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
        <button onClick={handleExportPDF} title="Export PDF" className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
          <FileDown size={15} />
        </button>
        <button onClick={handleDelete} title="Delete" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Two-column layout: invoice + right panel */}
      <div className="flex gap-0 px-4 py-6 max-w-6xl mx-auto items-start">

        {/* ── INVOICE DOCUMENT ── */}
        <div
          id="invoice-doc"
          ref={invoiceRef}
          className="flex-1 bg-white rounded-2xl shadow-invoice overflow-hidden relative min-w-0"
        >
          {/* ─── HEADER ─── */}
          <div className="bg-brand px-7 pt-7 pb-6">
            <div className="flex items-start justify-between gap-6">

              {/* Left: logo + contact */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-accent font-black text-base leading-none">//</span>
                  <h1 className="text-white text-lg font-bold tracking-tight">{company.name}</h1>
                </div>
                <div className="space-y-1.5">
                  <ContactRow letter="A" value={company.address} />
                  <ContactRow letter="P" value={company.phone} />
                  <ContactRow letter="E" value={company.email} />
                  <ContactRow letter="W" value={company.website} />
                </div>
              </div>

              {/* Right: INVOICE + meta */}
              <div className="flex-shrink-0 text-right">
                <div className="text-[#1e88e5] text-3xl font-black tracking-widest mb-4">INVOICE</div>

                <div className="space-y-3 text-left min-w-[200px]">
                  {/* Invoice # */}
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Invoice #</div>
                    <div className="text-slate-300 text-xs font-mono font-semibold">{invoice.invoiceNumber}</div>
                  </div>

                  {/* Date */}
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Date</div>
                    <input
                      type="date"
                      className="bg-transparent border border-transparent hover:border-white/30 focus:border-accent focus:bg-white/10 outline-none rounded px-1 py-0.5 text-slate-300 text-xs transition-colors w-full"
                      value={invoice.date}
                      onChange={e => upd({ date: e.target.value })}
                    />
                  </div>

                  {/* Status toggle */}
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Status</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleStatus}
                        className={`relative flex items-center h-6 w-12 rounded-full transition-colors duration-300 flex-shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${isPaid ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                      <span className={`text-xs font-bold ${isPaid ? 'text-emerald-400' : 'text-amber-300'}`}>
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Team Code */}
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Team Code</div>
                    <input
                      className="bg-transparent border border-transparent hover:border-white/30 focus:border-accent focus:bg-white/10 outline-none rounded px-1 py-0.5 text-slate-300 text-xs transition-colors w-full placeholder-slate-600"
                      placeholder="—"
                      value={invoice.teamCode || ''}
                      onChange={e => upd({ teamCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CUSTOMER / PROPERTY BOXES ─── */}
          <div className="px-7 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Customer details */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Customer details
              </div>
              <div className="border border-slate-200 rounded-lg p-3 min-h-[90px]">
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

            {/* Job / property details */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Job / property details
              </div>
              <div className="border border-slate-200 rounded-lg p-3 min-h-[90px]">
                <textarea
                  className="inv-textarea h-20"
                  placeholder="Property, notes, special requests..."
                  value={[invoice.clientDetails.name, invoice.clientDetails.address].join('\n')}
                  onChange={e => {
                    const [name = '', address = ''] = e.target.value.split('\n');
                    upd(prev => ({ ...prev, clientDetails: { name, address } }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* PENDING / PAID stamp — positioned relative to invoice doc */}
          <Stamp status={invoice.status} />

          {/* ─── LINE ITEMS ─── */}
          <div className="px-7 pb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="text-left pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-1/2">Description</th>
                  <th className="text-center pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-14">Qty</th>
                  <th className="text-center pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-6">$</th>
                  <th className="text-right pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-24">Unit Price</th>
                  <th className="text-right pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-24">Total</th>
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
              Add line item
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
                <span className="text-[#1e88e5]">{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* ─── NOTES ─── */}
          <div className="px-7 pb-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Notes</div>
            <textarea
              className="inv-textarea h-16 text-xs"
              placeholder="Payment instructions, terms, or notes…"
              value={invoice.notes}
              onChange={e => upd({ notes: e.target.value })}
            />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="no-print w-72 ml-4 flex-shrink-0 space-y-4">
          {/* Company stats */}
          <div className="bg-white rounded-2xl shadow-invoice p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              {company.name.toUpperCase()}
            </div>
            <div className="text-3xl font-black text-[#1e88e5] leading-none mb-0.5">
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

            <div className="border-t border-slate-100 pt-3">
              <button
                onClick={doSave}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl transition-all text-sm"
              >
                {saveMsg || 'Save'}
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
