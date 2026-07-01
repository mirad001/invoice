import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CompanyView from './components/CompanyView';
import InvoiceEditor from './components/InvoiceEditor';
import CompanySettings from './components/CompanySettings';

function AppInner() {
  const { currentUser, companies, peekAndBumpCounter } = useApp();

  // Staff always starts on a new invoice for the first company.
  // Admin starts on the dashboard.
  const getInitialView = () => {
    if (!currentUser) return { type: 'dashboard' };
    if (currentUser.role === 'staff') {
      const first = companies[0];
      const num = peekAndBumpCounter(first.prefix);
      return { type: 'invoice', companyId: first.id, invoiceId: 'new', invoiceNumber: num };
    }
    return { type: 'dashboard' };
  };

  const [view, setView] = useState(getInitialView);

  if (!currentUser) return <Login />;

  const isAdmin = currentUser.role === 'admin';

  return (
    <Layout view={view} setView={setView}>
      {view.type === 'dashboard' && isAdmin && (
        <Dashboard setView={setView} />
      )}
      {view.type === 'company' && isAdmin && (
        <CompanyView
          key={view.companyId}
          companyId={view.companyId}
          setView={setView}
        />
      )}
      {view.type === 'invoice' && (
        <InvoiceEditor
          key={view.invoiceId + (view.invoiceNumber || '')}
          companyId={view.companyId}
          invoiceId={view.invoiceId}
          invoiceNumber={view.invoiceNumber}
          setView={setView}
        />
      )}
      {view.type === 'settings' && isAdmin && (
        <CompanySettings
          key={view.companyId}
          companyId={view.companyId}
          setView={setView}
        />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
