import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings, Trash2, ExternalLink, CheckCircle, Clock, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, formatDate, sumInvoices, getStartOfMonth,
} from '../utils/invoiceUtils';

export default function CompanyView({ companyId, setView }) {
  const { companies, invoices, saveInvoice, deleteInvoice, peekAndBumpCounter, currentUser } = useApp();
  const company = companies.find(c => c.id === companyId);
  const monthStart = getStartOfMonth();

  const companyInvoices = useMemo(
    () => [...invoices.filter(i => i.companyId === companyId)]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [invoices, companyId]
  );
  const monthInvoices = companyInvoices.filter(i => new Date(i.createdAt) >= monthStart);
  const pendingInvoices = companyInvoices.filter(i => i.status === 'pending');

  const handleNewInvoice = () => {
    const invoiceNumber = peekAndBumpCounter(company.prefix);
    setView({ type: 'invoice', companyId, invoiceId: 'new', invoiceNumber });
  };

  const toggleStatus = (inv, e) => {
    e.stopPropagation();
    saveInvoice({ ...inv, status: inv.status === 'paid' ? 'pending' : 'paid', updatedAt: new Date().toISOString() });
  };

  const handleDelete = (inv, e) => {
    e.stopPropagation();
    if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) deleteInvoice(inv.id);
  };

  if (!company) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent font-bold text-sm flex items-center justify-center">
              {company.prefix.slice(0, 2)}
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{company.name}</h1>
          </div>
          <div className="text-sm text-slate-400 ml-13 pl-[52px] space-y-0.5">
            <div>{company.address}</div>
            <div>{company.phone} · {company.email}</div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setView({ type: 'settings', companyId })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-sm font-medium text-slate-600 transition-all"
            >
              <Settings size={14} />
              Settings
            </button>
          )}
          <button
            onClick={handleNewInvoice}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-dark transition-all shadow-sm"
          >
            <Plus size={16} />
            New Invoice
          </button>
        </div>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-invoice p-4 text-center"
        >
          <div className="text-xl font-bold text-slate-800">{formatCurrency(sumInvoices(monthInvoices))}</div>
          <div className="text-xs text-slate-500 mt-0.5">This month</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="bg-white rounded-xl shadow-invoice p-4 text-center"
        >
          <div className="text-xl font-bold text-emerald-600">
            {formatCurrency(sumInvoices(companyInvoices.filter(i => i.status === 'paid' && new Date(i.createdAt) >= monthStart)))}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Paid this month</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-xl shadow-invoice p-4 text-center"
        >
          <div className="text-xl font-bold text-amber-600">{formatCurrency(sumInvoices(pendingInvoices))}</div>
          <div className="text-xs text-slate-500 mt-0.5">{pendingInvoices.length} pending</div>
        </motion.div>
      </div>

      {/* Invoice list */}
      {companyInvoices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 text-slate-400"
        >
          <FileText size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-500">No invoices yet</p>
          <p className="text-sm mt-1">Click "New Invoice" to get started.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-invoice overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">
              Invoices
              <span className="ml-2 text-xs font-normal text-slate-400">{companyInvoices.length} total</span>
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {companyInvoices.map((inv, idx) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                onClick={() => setView({ type: 'invoice', companyId, invoiceId: inv.id })}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-slate-500">{inv.invoiceNumber}</span>
                  </div>
                  <div className="font-semibold text-sm text-slate-700 truncate">
                    {inv.billTo?.name || <span className="italic font-normal text-slate-400">No client name</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{formatDate(inv.date)}</div>
                </div>

                <div className="text-right hidden sm:block flex-shrink-0">
                  <div className="font-bold text-slate-800">{formatCurrency(inv.grandTotal)}</div>
                  <div className="text-xs text-slate-400">{inv.signatures?.length || 0} sig</div>
                </div>

                {/* Status toggle */}
                <button
                  onClick={(e) => toggleStatus(inv, e)}
                  title="Toggle paid/pending"
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 transition-all ${
                    inv.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  }`}
                >
                  {inv.status === 'paid'
                    ? <><CheckCircle size={12} /> Paid</>
                    : <><Clock size={12} /> Pending</>
                  }
                </button>

                <button
                  onClick={(e) => handleDelete(inv, e)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all"
                  title="Delete invoice"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
