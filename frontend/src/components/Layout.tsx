import { useState } from 'react';
import { LayoutDashboard, List, Tags, Home, HardHat, Menu, X, PiggyBank, Box } from 'lucide-react';

export type Page = 'dashboard' | 'gastos' | 'categorias' | 'economias' | 'modelo';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: Page; label: string; icon: typeof Home; description: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Visao geral' },
    { id: 'gastos', label: 'Gastos', icon: List, description: 'Listagem' },
    { id: 'economias', label: 'Economias', icon: PiggyBank, description: 'Financas e metas' },
    { id: 'modelo', label: 'Modelo 3D', icon: Box, description: 'Modelo da casa' },
    { id: 'categorias', label: 'Categorias', icon: Tags, description: 'Organizacao' },
  ];

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-dark text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold tracking-tight">ConstruCalc</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className={`w-72 bg-gradient-dark text-white flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo / Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
              <HardHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">ConstruCalc</h1>
              <p className="text-xs text-white/50 font-medium">Controle de Obras</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="text-xs font-bold text-white/30 uppercase tracking-wider px-4 mb-3">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-primary shadow-lg shadow-primary-500/30'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <div className="text-left">
                  <div className="font-semibold text-sm">{item.label}</div>
                  <div className={`text-xs ${isActive ? 'text-white/70' : 'text-white/30'}`}>{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
              <span className="text-xs font-medium text-white/70">Sistema ativo</span>
            </div>
            <p className="text-xs text-white/30">v1.0 - SQLite Local</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="md:hidden fixed inset-0 bg-black/40 z-30" />}

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-72 scrollbar-thin pt-16 md:pt-0">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
