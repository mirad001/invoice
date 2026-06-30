import { motion } from 'framer-motion';
import { LayoutDashboard, Building2, LogOut, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ view, setView, mobile, onClose }) {
  const { currentUser, logout, companies, invoices } = useApp();

  const nav = (v) => {
    setView(v);
    if (onClose) onClose();
  };

  return (
    <aside className="flex flex-col h-full bg-slate-900 text-slate-100 w-64 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-slate-800">
        <div className="text-accent font-black text-2xl tracking-tight">BOND</div>
        <div className="text-slate-500 text-[11px] tracking-widest uppercase mt-0.5">Invoice Dashboard</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-3 space-y-0.5">
        <SidebarItem
          icon={<LayoutDashboard size={16} />}
          label="Overview"
          active={view.type === 'dashboard'}
          onClick={() => nav({ type: 'dashboard' })}
        />

        <div className="pt-3 pb-1.5 px-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Companies</span>
        </div>

        {companies.map((co) => {
          const coInvoices = invoices.filter(i => i.companyId === co.id);
          const pendingCount = coInvoices.filter(i => i.status === 'pending').length;
          const isActive = (view.type === 'company' || view.type === 'invoice' || view.type === 'settings') && view.companyId === co.id;

          return (
            <button
              key={co.id}
              onClick={() => nav({ type: 'company', companyId: co.id })}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                isActive ? 'bg-white/20' : 'bg-slate-700 group-hover:bg-slate-600'
              }`}>
                {co.prefix.slice(0, 2)}
              </span>
              <span className="flex-1 text-sm font-medium leading-tight truncate">{co.name}</span>
              {pendingCount > 0 && (
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0 ${
                  isActive ? 'bg-white/25 text-white' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800 p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
          {currentUser?.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-200 truncate">{currentUser?.name}</div>
          <div className="text-[11px] text-slate-500 capitalize">{currentUser?.role}</div>
        </div>
        <button
          onClick={logout}
          title="Log out"
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 ${
        active ? 'bg-accent text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
