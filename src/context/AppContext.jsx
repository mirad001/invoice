import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_COMPANIES } from '../config/companies';
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
  const [invoices, setInvoices] = useState(() => load('bond_invoices', []));
  const [counters, setCounters] = useState(() => load('bond_counters', {}));
  const [companies, setCompanies] = useState(() => load('bond_companies', DEFAULT_COMPANIES));

  useEffect(() => { save('bond_user', currentUser); }, [currentUser]);
  useEffect(() => { save('bond_invoices', invoices); }, [invoices]);
  useEffect(() => { save('bond_counters', counters); }, [counters]);
  useEffect(() => { save('bond_companies', companies); }, [companies]);

  const login = useCallback((user) => setCurrentUser(user), []);
  const logout = useCallback(() => setCurrentUser(null), []);

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

  const updateCompany = useCallback((id, fields) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  }, []);

  const resetCompanies = useCallback(() => {
    setCompanies(DEFAULT_COMPANIES);
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
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
