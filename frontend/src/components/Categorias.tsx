import { useState, useEffect } from 'react';
import { Categoria } from '../types';
import { api } from '../api';
import { Plus, Trash2, Package, Users, MoreHorizontal, Tag } from 'lucide-react';

export function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newCategoria, setNewCategoria] = useState({ nome: '', tipo: 'material' as const });

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const data = await api.getCategorias();
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCategoria(newCategoria);
      setNewCategoria({ nome: '', tipo: 'material' });
      setShowForm(false);
      loadCategorias();
    } catch (error) {
      alert('Erro ao criar categoria. Talvez ja exista.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza? Gastos vinculados podem perder a categoria.')) {
      try {
        await api.deleteCategoria(id);
        loadCategorias();
      } catch (error) {
        alert('Erro ao deletar categoria.');
      }
    }
  };

  const grouped = {
    material: categorias.filter((c) => c.tipo === 'material'),
    mao_de_obra: categorias.filter((c) => c.tipo === 'mao_de_obra'),
    outro: categorias.filter((c) => c.tipo === 'outro'),
  };

  const tipoConfig: Record<string, { label: string; icon: typeof Tag; gradient: string; bg: string; text: string }> = {
    material: { label: 'Materiais', icon: Package, gradient: 'bg-gradient-success', bg: 'bg-success-50', text: 'text-success-600' },
    mao_de_obra: { label: 'Mao de Obra', icon: Users, gradient: 'bg-gradient-warning', bg: 'bg-warning-50', text: 'text-warning-600' },
    outro: { label: 'Outros', icon: MoreHorizontal, gradient: 'bg-gradient-accent', bg: 'bg-accent-50', text: 'text-accent-600' },
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Organizacao</span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Categorias</h1>
          <p className="text-slate-500 mt-1">Organize seus gastos por tipo e categoria</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card animate-scale-in">
          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="label">Nome da Categoria</label>
              <input
                type="text"
                value={newCategoria.nome}
                onChange={(e) => setNewCategoria({ ...newCategoria, nome: e.target.value })}
                className="input"
                required
                placeholder="Ex: Hidraulica, Telhado, Fundacao..."
              />
            </div>
            <div className="w-full md:w-48">
              <label className="label">Tipo</label>
              <select
                value={newCategoria.tipo}
                onChange={(e) => setNewCategoria({ ...newCategoria, tipo: e.target.value as any })}
                className="input"
              >
                <option value="material">Material</option>
                <option value="mao_de_obra">Mao de Obra</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button type="submit" className="btn btn-primary flex-1 md:flex-none">Adicionar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1 md:flex-none">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Groups */}
      {Object.entries(grouped).map(([tipo, cats]) => {
        const config = tipoConfig[tipo];
        const Icon = config.icon;

        return (
          <div key={tipo} className="card card-hover">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-11 h-11 rounded-2xl ${config.gradient} flex items-center justify-center shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{config.label}</h2>
                <p className="text-xs text-slate-400">{cats.length} categoria(s)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cats.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center justify-between bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-xl px-4 py-3 transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.bg.replace('50', '500')}`} />
                    <span className="font-semibold text-slate-700 truncate">{cat.nome}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id!)}
                    className="w-7 h-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {cats.length === 0 && (
                <p className="text-slate-400 text-sm col-span-full text-center py-4">Nenhuma categoria neste tipo.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
