 import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, X, RotateCcw, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TEMPLATE_LIST } from './InvoiceEditor';

const FIELDS = [
  { key: 'name', label: 'Company Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'website', label: 'Website', type: 'text' },
  { key: 'address', label: 'Address', type: 'text' },
];

export default function CompanySettings({ companyId, setView }) {
  const { companies, updateCompany, resetCompanies } = useApp();
  const company = companies.find(c => c.id === companyId);
  const [form, setForm] = useState({ ...company });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateCompany(companyId, form);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setView({ type: 'company', companyId });
    }, 900);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setView({ type: 'company', companyId })}
          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <X size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Company Settings</h1>
          <p className="text-sm text-slate-500">{company.name}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-invoice p-6 space-y-5"
      >
        {FIELDS.map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              {label}
            </label>
            <input
              type={type}
              value={form[key] || ''}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
            />
          </div>
        ))}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
            Invoice Template
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TEMPLATE_LIST.map(tpl => {
              const active = (form.invoiceTemplate || 'minimal') === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, invoiceTemplate: tpl.id }))}
                  className={`relative text-left p-3 rounded-xl border-2 transition-all ${
                    active ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                  <div className={`w-full h-8 rounded-lg mb-2 ${tpl.swatchCls}`} />
                  <div className="text-xs font-bold text-slate-800">{tpl.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{tpl.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-accent text-white hover:bg-accent-dark'
            }`}
          >
            <Save size={15} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
          <button
            onClick={() => setView({ type: 'company', companyId })}
            className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-600 transition-all"
          >
            Cancel
          </button>
        </div>
      </motion.div>

      <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500 mb-3">
          Want to restore all companies to their original defaults?
        </p>
        <button
          onClick={() => {
            if (confirm('Reset ALL company details to defaults? This cannot be undone.')) {
              resetCompanies();
              setView({ type: 'company', companyId });
            }
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
        >
          <RotateCcw size={12} />
          Reset all companies to defaults
        </button>
      </div>
    </div>
  );
}
