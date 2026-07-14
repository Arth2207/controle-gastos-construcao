import { useState, useEffect } from 'react';
import { Layout, Page } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { GastoList } from './components/GastoList';
import { GastoForm } from './components/GastoForm';
import { Categorias } from './components/Categorias';
import { Economias } from './components/Economias';
import { Gasto } from './types';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleNew = () => {
    setEditingGasto(undefined);
    setShowForm(true);
  };

  const handleEdit = (gasto: Gasto) => {
    setEditingGasto(gasto);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingGasto(undefined);
    setRefreshKey((k) => k + 1);
    showToast(editingGasto ? 'Gasto atualizado com sucesso!' : 'Gasto registrado com sucesso!');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingGasto(undefined);
  };

  const renderPage = () => {
    if (showForm) {
      return <GastoForm gasto={editingGasto} onSave={handleSave} onCancel={handleCancel} />;
    }

    switch (page) {
      case 'dashboard':
        return <Dashboard onNew={handleNew} />;
      case 'gastos':
        return <GastoList onEdit={handleEdit} onNew={handleNew} refreshKey={refreshKey} />;
      case 'economias':
        return <Economias refreshKey={refreshKey} />;
      case 'categorias':
        return <Categorias />;
      default:
        return <Dashboard onNew={handleNew} />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={(p) => { setShowForm(false); setPage(p); }}>
      <div key={`${page}-${showForm}-${editingGasto?.id}`} className="animate-slide-up">
        {renderPage()}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl ${toast.type === 'success' ? 'bg-success-500 text-white' : 'bg-red-500 text-white'}`}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
