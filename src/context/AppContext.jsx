import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_COMPANIES } from '../config/companies';
import { DEFAULT_ADMIN, STAFF_PIN } from '../config/users';
import { generateInvoiceNumber } from '../utils/invoiceUtils';

const AppContext = createContext(null);

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => load('bond_user', null));
  const [invoices, setInvoices]       = useState(() => load('bond_invoices', []));
  const [counters, setCounters]       = useState(() => load('bond_counters', {}));
  const [companies, setCompanies]     = useState(() => load('bond_companies', null) || DEFAULT_COMPANIES);
  const [adminCreds, setAdminCreds]   = useState(() => load('bond_admin_creds', DEFAULT_ADMIN));

  useEffect(() => { save('bond_user', currentUser); },   [currentUser]);
  useEffect(() => { save('bond_invoices', invoices); },  [invoices]);
  useEffect(() => { save('bond_counters', counters); },  [counters]);
  useEffect(() => { save('bond_companies', companies); },[companies]);
  useEffect(() => { save('bond_admin_creds', adminCreds); }, [adminCreds]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const loginAdmin = useCallback((email, password) => {
    if (
      email.trim().toLowerCase() === adminCreds.email.toLowerCase() &&
      password === adminCreds.password
    ) {
      setCurrentUser({ id: 'admin', name: 'Admin', role: 'admin' });
      return true;
    }
    return false;
  }, [adminCreds]);

  const loginStaff = useCallback((pin) => {
    if (pin === STAFF_PIN) {
      setCurrentUser({ id: 'staff', name: 'Staff', role: 'staff' });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setCurrentUser(null), []);

  // ── Credential management ─────────────────────────────────────────────────
  const verifyAdminPassword = useCallback((password) => {
    return password === adminCreds.password;
  }, [adminCreds]);

  const updateAdminCreds = useCallback((fields) => {
    setAdminCreds(prev => ({ ...prev, ...fields }));
  }, []);

  const resetAdminPassword = useCallback((code, newPassword) => {
    if (code.trim() !== adminCreds.recoveryCode) return false;
    setAdminCreds(prev => ({ ...prev, password: newPassword }));
    return true;
  }, [adminCreds]);

  // ── Invoice counters ──────────────────────────────────────────────────────
  const peekAndBumpCounter = useCallback((prefix) => {
    const stored = load('bond_counters', {});
    const next = (stored[prefix] || 0) + 1;
    const updated = { ...stored, [prefix]: next };
    save('bond_counters', updated);
    setCounters(updated);
    return generateInvoiceNumber(prefix, next);
  }, []);

  const peekCounter = useCallback((prefix) => {
    const stored = load('bond_counters', {});
    const next = (stored[prefix] || 0) + 1;
    return generateInvoiceNumber(prefix, next);
  }, []);

  // ── Invoices ──────────────────────────────────────────────────────────────
  const saveInvoice = useCallback((invoice) => {
    setInvoices(prev => {
      const idx = prev.findIndex(i => i.id === invoice.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = invoice;
        return next;
      }
      return [...prev, invoice];
    });
  }, []);

  const deleteInvoice = useCallback((id) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
  }, []);

  // ── Companies ─────────────────────────────────────────────────────────────
  const updateCompany = useCallback((id, fields) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  }, []);

  const resetCompanies = useCallback(() => {
    setCompanies(DEFAULT_COMPANIES);
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, logout,
      loginAdmin, loginStaff,
      adminEmail: adminCreds.email,
      verifyAdminPassword, updateAdminCreds, resetAdminPassword,
      invoices, saveInvoice, deleteInvoice,
      counters,
      peekAndBumpCounter, peekCounter,
      companies, updateCompany, resetCompanies,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
