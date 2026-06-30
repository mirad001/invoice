import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CompanyView from './components/CompanyView';
import InvoiceEditor from './components/InvoiceEditor';
import CompanySettings from './components/CompanySettings';

function AppInner() {
  const { currentUser } = useApp();
  const [view, setView] = useState({ type: 'dashboard' });

  if (!currentUser) return <Login />;

  return (
    <Layout view={view} setView={setView}>
      {view.type === 'dashboard' && (
        <Dashboard setView={setView} />
      )}
      {view.type === 'company' && (
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
      {view.type === 'settings' && (
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
