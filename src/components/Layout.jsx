import { useApp } from '../context/AppContext';
import { LogOut } from 'lucide-react';

export default function Layout({ children, view, setView }) {
  const { currentUser, logout, companies, invoices, peekAndBumpCounter } = useApp();

  const activeCompanyId = view.companyId || null;
  const isInvoiceNew = view.type === 'invoice' && view.invoiceId === 'new';
  const isRecords = view.type === 'company';
  const showSubNav = activeCompanyId && (view.type === 'invoice' || view.type === 'company');

  const companyInvoiceCount = activeCompanyId
    ? invoices.filter(i => i.companyId === activeCompanyId).length
    : 0;

  const handleCompanyTab = (co) => {
    setView({ type: 'company', companyId: co.id });
  };

  const handleNewInvoice = () => {
    if (!activeCompanyId) return;
    const company = companies.find(c => c.id === activeCompanyId);
    const invoiceNumber = peekAndBumpCounter(company.prefix);
    setView({ type: 'invoice', companyId: activeCompanyId, invoiceId: 'new', invoiceNumber });
  };

  const userName = currentUser?.name || 'User';
  const userRole = currentUser?.role ? (currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)) : 'User';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      {/* Top header */}
      <header className="bg-brand text-white flex items-center px-5 h-[50px] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-black text-accent text-xl leading-none">//</span>
          <span className="font-bold text-white text-sm tracking-tight">Bond Cleaning</span>
          <span className="text-slate-400 text-xs ml-1">Invoice &amp; Approvals</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{userRole} · {userName}</span>
          <button
            onClick={logout}
            className="text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Company tabs */}
      <div className="bg-brand flex items-end shrink-0 border-t border-white/5">
        <div className="flex items-end flex-1 overflow-x-auto">
          {companies.map(co => {
            const isActive = co.id === activeCompanyId;
            return (
              <button
                key={co.id}
                onClick={() => handleCompanyTab(co)}
                className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'text-white border-accent bg-white/5'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-white/10'
                }`}
              >
                {co.name}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setView({ type: 'dashboard' })}
          className={`px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shrink-0 border-b-2 transition-all ${
            view.type === 'dashboard'
              ? 'bg-accent text-white border-accent'
              : 'bg-accent/90 text-white border-accent hover:bg-accent'
          }`}
        >
          <span className="w-2.5 h-2.5 bg-white rounded-sm inline-block" />
          All-company totals
        </button>
      </div>

      {/* Sub-nav: New invoice / Records */}
      {showSubNav && (
        <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleNewInvoice}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              isInvoiceNew
                ? 'bg-brand text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            New invoice
          </button>
          <button
            onClick={() => setView({ type: 'company', companyId: activeCompanyId })}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isRecords
                ? 'bg-brand text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Records ({companyInvoiceCount})
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
