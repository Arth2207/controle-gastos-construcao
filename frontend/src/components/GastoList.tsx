import { useState, useEffect } from 'react';
import { Gasto, Categoria } from '../types';
import { api } from '../api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Pencil, Trash2, Search, ShoppingBag, Package, Users, MoreHorizontal, Inbox, Download } from 'lucide-react';

interface GastoListProps {
  onEdit: (gasto: Gasto) => void;
  onNew: () => void;
  refreshKey: number;
}

export function GastoList({ onEdit, onNew, refreshKey }: GastoListProps) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  useEffect(() => {
    loadGastos();
    loadCategorias();
  }, [refreshKey]);

  useEffect(() => {
    loadGastos();
  }, [filterTipo, filterCategoria]);

  const loadCategorias = async () => {
    try {
      const data = await api.getCategorias();
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadGastos = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterTipo) params.tipo = filterTipo;
      if (filterCategoria) params.categoria_id = parseInt(filterCategoria);
      const data = await api.getGastos(params);
      setGastos(data);
    } catch (error) {
      console.error('Erro ao carregar gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este gasto?')) {
      try {
        await api.deleteGasto(id);
        loadGastos();
      } catch (error) {
        console.error('Erro ao deletar gasto:', error);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Descricao', 'Tipo', 'Categoria', 'Valor', 'Quantidade', 'Unidade', 'Data', 'Fornecedor', 'Observacoes'];
    const rows = filteredGastos.map((g) => [
      `"${g.descricao}"`,
      g.tipo,
      g.categoria_nome || '',
      g.valor.toFixed(2),
      g.quantidade?.toString() || '1',
      g.unidade || '',
      g.data,
      `"${g.fornecedor || ''}"`,
      `"${g.observacoes || ''}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredGastos = gastos.filter((g) =>
    g.descricao.toLowerCase().includes(search.toLowerCase()) ||
    (g.fornecedor || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalFiltered = filteredGastos.reduce((sum, g) => sum + g.valor, 0);

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'material') return Package;
    if (tipo === 'mao_de_obra') return Users;
    return MoreHorizontal;
  };

  const getTipoBg = (tipo: string) => {
    if (tipo === 'material') return 'bg-success-100 text-success-600';
    if (tipo === 'mao_de_obra') return 'bg-warning-100 text-warning-600';
    return 'bg-slate-100 text-slate-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Registros</span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Gastos</h1>
          <p className="text-slate-500 mt-1">Gerencie todos os gastos da sua obra</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} disabled={filteredGastos.length === 0} className="btn btn-secondary flex items-center gap-2 disabled:opacity-50">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button onClick={onNew} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Gasto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                placeholder="Descricao ou fornecedor..."
              />
            </div>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="input">
              <option value="">Todos os tipos</option>
              <option value="material">Material</option>
              <option value="mao_de_obra">Mao de Obra</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="label">Categoria</label>
            <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className="input">
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between bg-gradient-primary rounded-2xl px-6 py-4 shadow-lg shadow-primary-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium">Registros encontrados</p>
            <p className="text-white text-xl font-bold">{filteredGastos.length}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-xs font-medium">Total filtrado</p>
          <p className="text-white text-2xl font-extrabold">{formatCurrency(totalFiltered)}</p>
        </div>
      </div>

      {/* Lista de Gastos */}
      {filteredGastos.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Inbox className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Nenhum gasto encontrado</h2>
          <p className="text-slate-400 mb-6">Clique em "Novo Gasto" para comecar a registrar.</p>
          <button onClick={onNew} className="btn btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Primeiro Gasto
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGastos.map((gasto, index) => {
            const Icon = getTipoIcon(gasto.tipo);
            const isMaterial = gasto.tipo === 'material';
            const isLabor = gasto.tipo === 'mao_de_obra';

            return (
              <div
                key={gasto.id}
                className="card card-hover flex items-center gap-4 py-4 !p-4 group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getTipoBg(gasto.tipo)}`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-800 truncate">{gasto.descricao}</p>
                    <span className={`badge flex-shrink-0 ${isMaterial ? 'badge-material' : isLabor ? 'badge-labor' : 'badge-other'}`}>
                      {isMaterial ? 'Material' : isLabor ? 'Mao de Obra' : 'Outro'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium text-slate-500">{gasto.categoria_nome || 'Sem categoria'}</span>
                    {gasto.fornecedor && (
                      <>
                        <span>·</span>
                        <span>{gasto.fornecedor}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{formatDate(gasto.data)}</span>
                    {gasto.quantidade && gasto.quantidade > 1 && (
                      <>
                        <span>·</span>
                        <span className="text-primary-500 font-medium">
                          {gasto.quantidade} {gasto.unidade} x {formatCurrency(gasto.valor / gasto.quantidade)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Valor */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-extrabold text-slate-800">{formatCurrency(gasto.valor)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(gasto)} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-primary-100 text-slate-500 hover:text-primary-600 flex items-center justify-center transition-colors" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(gasto.id!)} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
