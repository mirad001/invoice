import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, formatDate, sumInvoices,
  getStartOfWeek, getStartOfMonth, getStartOfYear,
} from '../utils/invoiceUtils';

const PERIODS = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

function getPeriodStart(key) {
  if (key === 'weekly') return getStartOfWeek();
  if (key === 'monthly') return getStartOfMonth();
  return getStartOfYear();
}

function getPeriodLabel(key) {
  if (key === 'weekly') return 'This Week';
  if (key === 'monthly') return 'This Month';
  return 'This Year';
}

export default function Dashboard({ setView }) {
  const { invoices, companies } = useApp();
  const [period, setPeriod] = useState('monthly');

  const periodStart = useMemo(() => getPeriodStart(period), [period]);

  const periodInvoices = useMemo(
    () => invoices.filter(i => new Date(i.createdAt) >= periodStart),
    [invoices, periodStart]
  );

  const overallTotal = sumInvoices(periodInvoices);
  const paidTotal = sumInvoices(periodInvoices.filter(i => i.status === 'paid'));
  const pendingTotal = sumInvoices(periodInvoices.filter(i => i.status === 'pending'));
  const pendingCount = periodInvoices.filter(i => i.status === 'pending').length;

  const perCompany = useMemo(() => companies.map(co => {
    const all = periodInvoices.filter(i => i.companyId === co.id);
    const paid = all.filter(i => i.status === 'paid');
    const pending = all.filter(i => i.status === 'pending');
    return {
      ...co,
      total: sumInvoices(all),
      paidTotal: sumInvoices(paid),
      pendingTotal: sumInvoices(pending),
      count: all.length,
      pendingCount: pending.length,
    };
  }), [periodInvoices, companies]);

  const recentInvoices = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [invoices]
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header + period toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-7">
        <h1 className="text-xl font-bold text-slate-800">All Companies</h1>
        <div className="flex items-center gap-1.5 ml-2 bg-white border border-slate-200 rounded-full p-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1 rounded-full text-sm font-semibold transition-all ${
                period === p.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overall total banner */}
      <motion.div
        key={period}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand rounded-2xl p-6 mb-6 text-white"
      >
        <div className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">
          {getPeriodLabel(period)} · All Companies Combined
        </div>
        <div className="text-5xl font-black mb-5 tracking-tight">
          {formatCurrency(overallTotal)}
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
          <div>
            <div className="text-white/50 text-xs mb-1">Total invoices</div>
            <div className="text-2xl font-bold">{periodInvoices.length}</div>
          </div>
          <div>
            <div className="text-emerald-400 text-xs mb-1">Paid</div>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(paidTotal)}</div>
          </div>
          <div>
            <div className="text-amber-400 text-xs mb-1">Pending ({pendingCount})</div>
            <div className="text-2xl font-bold text-amber-400">{formatCurrency(pendingTotal)}</div>
          </div>
        </div>
      </motion.div>

      {/* Per-company cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {perCompany.map((co, i) => (
          <motion.div
            key={co.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setView({ type: 'company', companyId: co.id })}
            className="bg-white rounded-2xl shadow-invoice p-5 cursor-pointer hover:shadow-lg transition-all group"
          >
            {/* Company label */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-accent group-hover:text-white transition-all">
                {co.prefix.slice(0, 2)}
              </div>
              <div className="font-semibold text-sm text-slate-700 leading-tight">{co.name}</div>
            </div>

            {/* Total amount */}
            <div className="text-3xl font-black text-slate-800 mb-1">
              {formatCurrency(co.total)}
            </div>
            <div className="text-xs text-slate-400 mb-4">
              {co.count === 0 ? 'No invoices' : `${co.count} invoice${co.count !== 1 ? 's' : ''}`}
            </div>

            {/* Paid / Pending breakdown */}
            <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Paid</div>
                <div className="text-sm font-bold text-emerald-600">{formatCurrency(co.paidTotal)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Pending</div>
                <div className={`text-sm font-bold ${co.pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {co.pendingCount > 0 ? formatCurrency(co.pendingTotal) : '—'}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent invoices */}
      {recentInvoices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-invoice overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Recent Invoices</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {recentInvoices.map(inv => {
              const co = companies.find(c => c.id === inv.companyId);
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => setView({ type: 'invoice', companyId: inv.companyId, invoiceId: inv.id })}
                >
                  <span className="text-xs font-mono text-slate-400 w-36 flex-shrink-0">{inv.invoiceNumber}</span>
                  <span className="flex-1 text-sm text-slate-600 truncate min-w-0">
                    {inv.billTo?.name || <span className="italic text-slate-400">No client</span>}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:block flex-shrink-0">{co?.prefix}</span>
                  <span className="text-xs text-slate-400 hidden md:block flex-shrink-0">{formatDate(inv.date)}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    inv.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {inv.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                  <span className="font-bold text-slate-800 text-sm flex-shrink-0">
                    {formatCurrency(inv.grandTotal)}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {invoices.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <Building2 size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No invoices yet</p>
          <p className="text-sm mt-1">Select a company tab above to create your first invoice.</p>
        </div>
      )}
    </div>
  );
}
