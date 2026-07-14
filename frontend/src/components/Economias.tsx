import { useState, useEffect } from 'react';
import { Economia, Meta, DashboardStats } from '../types';
import { api } from '../api';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  PiggyBank, Plus, Trash2, TrendingUp, TrendingDown, Wallet, Target,
  ArrowDownCircle, ArrowUpCircle, BarChart3, Calendar, AlertTriangle,
  CheckCircle2, Clock, DollarSign, Percent, Save, X,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

interface EconomiasProps {
  refreshKey: number;
}

const MES_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

function TipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export function Economias({ refreshKey }: EconomiasProps) {
  const [economias, setEconomias] = useState<Economia[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEconForm, setShowEconForm] = useState(false);
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState('');

  const [econForm, setEconForm] = useState({
    descricao: '', valor: 0, data: new Date().toISOString().split('T')[0],
    tipo: 'deposito' as 'deposito' | 'rendimento' | 'saque', fonte: '', observacoes: '',
  });
  const [metaForm, setMetaForm] = useState({
    nome: '', valor_objetivo: 0, data_limite: '',
  });

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [econData, metasData, statsData] = await Promise.all([
        api.getEconomias(),
        api.getMetas(),
        api.getDashboardStats(),
      ]);
      setEconomias(econData);
      setMetas(metasData);
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitEcon = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createEconomia(econForm);
    setEconForm({
      descricao: '', valor: 0, data: new Date().toISOString().split('T')[0],
      tipo: 'deposito', fonte: '', observacoes: '',
    });
    setShowEconForm(false);
    loadData();
  };

  const submitMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createMeta(metaForm);
    setMetaForm({ nome: '', valor_objetivo: 0, data_limite: '' });
    setShowMetaForm(false);
    loadData();
  };

  const removeEcon = async (id: number) => {
    if (confirm('Excluir este registro?')) {
      await api.deleteEconomia(id);
      loadData();
    }
  };

  const removeMeta = async (id: number) => {
    if (confirm('Excluir esta meta?')) {
      await api.deleteMeta(id);
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-40 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  const totalEcon = stats?.totalEconomias || 0;
  const totalGastos = stats?.totalGastos || 0;
  const totalAportes = stats?.totalAportes || 0;
  const totalRendimentos = stats?.totalRendimentos || 0;
  const totalSaques = stats?.totalSaques || 0;

  const saldoLiquido = totalEcon - totalGastos;
  const pctGasto = totalEcon > 0 ? (totalGastos / totalEcon) * 100 : 0;
  const pctDisponivel = 100 - pctGasto;
  const taxaRendimento = totalAportes > 0 ? (totalRendimentos / totalAportes) * 100 : 0;

  const gastosMensais = stats?.gastosPorMes || [];
  const mediaGastoMensal = gastosMensais.length > 0
    ? gastosMensais.slice(0, 3).reduce((s, m) => s + m.valor, 0) / Math.min(gastosMensais.length, 3)
    : 0;

  const mesesRestantes = mediaGastoMensal > 0 && saldoLiquido > 0 ? Math.floor(saldoLiquido / mediaGastoMensal) : 0;

  const econMensal = stats?.economiasPorMes || [];
  const mediaEconMensal = econMensal.length > 0
    ? econMensal.slice(0, 3).reduce((s, m) => s + m.valor, 0) / Math.min(econMensal.length, 3)
    : 0;

  const gastosMap = new Map((stats?.gastosPorMes || []).map((m) => [m.mes, m.valor]));
  const econMap = new Map((stats?.economiasPorMes || []).map((m) => [m.mes, m.valor]));
  const todosMeses = Array.from(new Set([...gastosMap.keys(), ...econMap.keys()])).sort();
  const comparativo = todosMeses.slice(-12).map((mes) => ({
    mesLabel: `${MES_LABELS[mes.split('-')[1]] || mes}/${mes.split('-')[0].slice(2)}`,
    Economias: econMap.get(mes) || 0,
    Gastos: gastosMap.get(mes) || 0,
  }));

  const econFiltradas = filterTipo ? economias.filter((e) => e.tipo === filterTipo) : economias;

  const tipoInfo: Record<string, { label: string; icon: any; color: string; bg: string; sign: string }> = {
    deposito: { label: 'Deposito', icon: ArrowDownCircle, color: 'text-success-600', bg: 'bg-success-100', sign: '+' },
    rendimento: { label: 'Rendimento', icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-100', sign: '+' },
    saque: { label: 'Saque', icon: ArrowUpCircle, color: 'text-red-600', bg: 'bg-red-100', sign: '-' },
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Cabecalho */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Financas</span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Economias &amp; Metas</h1>
          <p className="text-slate-500 mt-1">Acompanhe seus recursos guardados e projecoes para a obra</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMetaForm(!showMetaForm)} className="btn btn-secondary flex items-center gap-2">
            <Target className="w-4 h-4" />
            Nova Meta
          </button>
          <button onClick={() => setShowEconForm(!showEconForm)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Registro
          </button>
        </div>
      </div>

      {/* Form Economia */}
      {showEconForm && (
        <div className="card animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Registrar Economia</h2>
            <button onClick={() => setShowEconForm(false)} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <form onSubmit={submitEcon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Tipo</label>
                <select value={econForm.tipo} onChange={(e) => setEconForm({ ...econForm, tipo: e.target.value as any })} className="input">
                  <option value="deposito">Deposito</option>
                  <option value="rendimento">Rendimento</option>
                  <option value="saque">Saque</option>
                </select>
              </div>
              <div>
                <label className="label">Valor (R$)</label>
                <input type="number" value={econForm.valor} onChange={(e) => setEconForm({ ...econForm, valor: parseFloat(e.target.value) || 0 })} className="input" required min="0" step="0.01" placeholder="0,00" />
              </div>
              <div>
                <label className="label">Data</label>
                <input type="date" value={econForm.data} onChange={(e) => setEconForm({ ...econForm, data: e.target.value })} className="input" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Descricao</label>
                <input type="text" value={econForm.descricao} onChange={(e) => setEconForm({ ...econForm, descricao: e.target.value })} className="input" required placeholder="Ex: Deposito mensal" />
              </div>
              <div>
                <label className="label">Fonte</label>
                <input type="text" value={econForm.fonte} onChange={(e) => setEconForm({ ...econForm, fonte: e.target.value })} className="input" placeholder="Banco, poupanca..." />
              </div>
            </div>
            <div>
              <label className="label">Observacoes</label>
              <input type="text" value={econForm.observacoes} onChange={(e) => setEconForm({ ...econForm, observacoes: e.target.value })} className="input" placeholder="Notas adicionais..." />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowEconForm(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Form Meta */}
      {showMetaForm && (
        <div className="card animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Nova Meta</h2>
            <button onClick={() => setShowMetaForm(false)} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <form onSubmit={submitMeta} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="label">Nome da Meta</label>
              <input type="text" value={metaForm.nome} onChange={(e) => setMetaForm({ ...metaForm, nome: e.target.value })} className="input" required placeholder="Ex: Custo total da obra" />
            </div>
            <div>
              <label className="label">Valor Objetivo (R$)</label>
              <input type="number" value={metaForm.valor_objetivo} onChange={(e) => setMetaForm({ ...metaForm, valor_objetivo: parseFloat(e.target.value) || 0 })} className="input" required min="0" step="0.01" placeholder="0,00" />
            </div>
            <div>
              <label className="label">Data Limite</label>
              <input type="date" value={metaForm.data_limite} onChange={(e) => setMetaForm({ ...metaForm, data_limite: e.target.value })} className="input" />
            </div>
            <div className="md:col-span-3 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowMetaForm(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Criar Meta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card bg-gradient-primary group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">GUARDADO</span>
            </div>
            <p className="text-white/70 text-sm font-medium mb-1">Total Acumulado</p>
            <p className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(totalEcon)}</p>
            <div className="flex items-center gap-1 mt-3 text-white/60 text-xs">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{economias.length} registros</span>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-warning group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">GASTO</span>
            </div>
            <p className="text-white/70 text-sm font-medium mb-1">Total Investido na Obra</p>
            <p className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(totalGastos)}</p>
            <div className="flex items-center gap-1 mt-3 text-white/60 text-xs">
              <Percent className="w-3.5 h-3.5" />
              <span>{pctGasto.toFixed(1)}% do guardado</span>
            </div>
          </div>
        </div>

        <div className={`stat-card group ${saldoLiquido >= 0 ? 'bg-gradient-success' : 'bg-gradient-accent'}`}>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                {saldoLiquido >= 0 ? <CheckCircle2 className="w-6 h-6 text-white" /> : <AlertTriangle className="w-6 h-6 text-white" />}
              </div>
              <span className="text-xs font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">
                {saldoLiquido >= 0 ? 'DISPONIVEL' : 'DEFICIT'}
              </span>
            </div>
            <p className="text-white/70 text-sm font-medium mb-1">Saldo Liquido</p>
            <p className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(saldoLiquido)}</p>
            <div className="flex items-center gap-1 mt-3 text-white/60 text-xs">
              {saldoLiquido >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{pctDisponivel.toFixed(1)}% disponivel</span>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-dark group">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">RENDIMENTO</span>
            </div>
            <p className="text-white/70 text-sm font-medium mb-1">Taxa de Rendimento</p>
            <p className="text-3xl font-extrabold text-white tracking-tight">{taxaRendimento.toFixed(2)}%</p>
            <div className="flex items-center gap-1 mt-3 text-white/60 text-xs">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{formatCurrency(totalRendimentos)} em rendimentos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Recursos vs Gastos</h2>
              <p className="text-xs text-slate-400">Quanto do dinheiro guardado ja foi investido na obra</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-600">Progresso de utilizacao</span>
              <span className="text-sm font-bold text-slate-800">{pctGasto.toFixed(1)}%</span>
            </div>
            <div className="h-8 bg-slate-100 rounded-2xl overflow-hidden flex">
              <div className="h-full bg-gradient-warning flex items-center justify-center transition-all duration-700" style={{ width: `${Math.min(pctGasto, 100)}%` }}>
                {pctGasto > 15 && <span className="text-xs font-bold text-white px-2">Gastos</span>}
              </div>
              <div className="h-full bg-gradient-success flex items-center justify-center transition-all duration-700" style={{ width: `${Math.min(pctDisponivel, 100)}%` }}>
                {pctDisponivel > 15 && <span className="text-xs font-bold text-white px-2">Disponivel</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-success-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownCircle className="w-4 h-4 text-success-600" />
                <span className="text-xs font-semibold text-success-700">Aportes</span>
              </div>
              <p className="text-lg font-bold text-success-800">{formatCurrency(totalAportes)}</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-primary-700">Rendimentos</span>
              </div>
              <p className="text-lg font-bold text-primary-800">{formatCurrency(totalRendimentos)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-semibold text-red-700">Saques</span>
              </div>
              <p className="text-lg font-bold text-red-800">{formatCurrency(totalSaques)}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Gastos Obra</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(totalGastos)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metas */}
      {metas.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-primary-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Metas</h2>
              <p className="text-xs text-slate-400">Acompanhe seus objetivos financeiros</p>
            </div>
          </div>
          <div className="space-y-5">
            {metas.map((meta) => {
              const progresso = meta.valor_objetivo > 0 ? Math.min((saldoLiquido / meta.valor_objetivo) * 100, 100) : 0;
              const restante = meta.valor_objetivo - saldoLiquido;
              const mesesParaMeta = mediaEconMensal > 0 && restante > 0 ? Math.ceil(restante / mediaEconMensal) : 0;
              const diasRestantes = meta.data_limite
                ? Math.ceil((new Date(meta.data_limite).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;
              const mesesAtePrazo = diasRestantes !== null ? Math.floor(diasRestantes / 30) : null;
              const alcancavel = mesesAtePrazo !== null && mesesParaMeta > 0 ? mesesParaMeta <= mesesAtePrazo : null;
              const economiaNecessariaMensal = mesesAtePrazo !== null && mesesAtePrazo > 0 && restante > 0 ? restante / mesesAtePrazo : 0;

              return (
                <div key={meta.id} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{meta.nome}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>Objetivo: <strong className="text-slate-600">{formatCurrency(meta.valor_objetivo)}</strong></span>
                          <span>Ja tem: <strong className="text-slate-600">{formatCurrency(saldoLiquido)}</strong></span>
                          {meta.data_limite && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(meta.data_limite)}
                              {diasRestantes !== null && diasRestantes >= 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${diasRestantes <= 30 ? 'bg-red-100 text-red-700' : diasRestantes <= 90 ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700'}`}>
                                  {diasRestantes} dias
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-slate-800">{progresso.toFixed(1)}%</p>
                        <p className="text-xs text-slate-400">
                          {restante > 0 ? `Faltam ${formatCurrency(restante)}` : 'Meta atingida!'}
                        </p>
                      </div>
                      <button onClick={() => removeMeta(meta.id!)} className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${progresso >= 100 ? 'bg-gradient-success' : 'bg-gradient-primary'}`}
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                  {restante > 0 && (
                    <div className="mt-2 space-y-1">
                      {mesesParaMeta > 0 && mediaEconMensal > 0 && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Projecao: ~{mesesParaMeta} meses para atingir (economia media de {formatCurrency(mediaEconMensal)}/mes)
                        </p>
                      )}
                      {alcancavel !== null && (
                        <p className={`text-xs font-bold flex items-center gap-1 ${alcancavel ? 'text-success-600' : 'text-red-600'}`}>
                          {alcancavel ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {alcancavel
                            ? `Alcancavel! Voce tem ${mesesAtePrazo} meses ate o prazo`
                            : `Nao alcancavel no prazo! Precisaria de ${formatCurrency(economiaNecessariaMensal)}/mes em ${mesesAtePrazo} meses restantes`}
                        </p>
                      )}
                      {economiaNecessariaMensal > 0 && !alcancavel && (
                        <p className="text-xs text-slate-400">
                          Sua economia atual: {formatCurrency(mediaEconMensal)}/mes | Necessaria: {formatCurrency(economiaNecessariaMensal)}/mes
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grafico Comparativo */}
      {comparativo.length > 0 && (
        <div className="card card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">Economias vs Gastos por Mes</h2>
                <p className="text-xs text-slate-400">Comparativo mensal</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-lg bg-primary-500" />
                <span className="text-slate-500">Economias</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-lg bg-warning-500" />
                <span className="text-slate-500">Gastos</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparativo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mesLabel" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TipBox />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="Economias" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Gastos" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Projecoes + Evolucao */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projecao de Sustentabilidade */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Projecao de Sustentabilidade</h2>
              <p className="text-xs text-slate-400">Quanto tempo o saldo dura no ritmo atual</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-600">Media de gastos mensais</span>
                <span className="text-lg font-bold text-warning-600">{formatCurrency(mediaGastoMensal)}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-600">Media de economia mensal</span>
                <span className="text-lg font-bold text-primary-600">{formatCurrency(mediaEconMensal)}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-600">Saldo liquido atual</span>
                <span className={`text-lg font-bold ${saldoLiquido >= 0 ? 'text-success-600' : 'text-red-600'}`}>{formatCurrency(saldoLiquido)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Meses restantes (projecao)</span>
                  <span className={`text-2xl font-extrabold ${saldoLiquido > 0 && mesesRestantes > 0 ? 'text-primary-600' : saldoLiquido <= 0 ? 'text-red-600' : 'text-success-600'}`}>
                    {saldoLiquido <= 0 ? 'Sem saldo' : mesesRestantes > 0 ? `${mesesRestantes} meses` : 'Indefinido'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alertas */}
            <div className="space-y-2">
              {saldoLiquido < 0 && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-700 text-sm">Atencao: Deficit!</p>
                    <p className="text-xs text-red-600">Seus gastos superam o dinheiro guardado. Considere novos aportes.</p>
                  </div>
                </div>
              )}
              {saldoLiquido >= 0 && mesesRestantes > 0 && mesesRestantes <= 3 && mediaGastoMensal > 0 && (
                <div className="flex items-start gap-3 bg-warning-50 border border-warning-200 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-warning-700 text-sm">Saldo acabando!</p>
                    <p className="text-xs text-warning-600">No ritmo atual, o saldo dura apenas {mesesRestantes} {mesesRestantes === 1 ? 'mes' : 'meses'}.</p>
                  </div>
                </div>
              )}
              {pctGasto > 80 && (
                <div className="flex items-start gap-3 bg-warning-50 border border-warning-200 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-warning-700 text-sm">Mais de 80% utilizado!</p>
                    <p className="text-xs text-warning-600">Voce ja usou {pctGasto.toFixed(0)}% do dinheiro guardado.</p>
                  </div>
                </div>
              )}
              {saldoLiquido > 0 && (mesesRestantes > 6 || mediaGastoMensal === 0) && (
                <div className="flex items-start gap-3 bg-success-50 border border-success-200 rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-success-700 text-sm">Situacao saudavel!</p>
                    <p className="text-xs text-success-600">Seus recursos estao em bom nivel para continuar a obra.</p>
                  </div>
                </div>
              )}
              {taxaRendimento > 0 && (
                <div className="flex items-start gap-3 bg-primary-50 border border-primary-200 rounded-xl p-4">
                  <TrendingUp className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-primary-700 text-sm">Rendimentos positivos!</p>
                    <p className="text-xs text-primary-600">Taxa de {taxaRendimento.toFixed(2)}% sobre aportes de {formatCurrency(totalAportes)}.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Evolucao do Saldo */}
        <div className="card card-hover">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Evolucao do Saldo</h2>
              <p className="text-xs text-slate-400">Acumulado de economias por mes</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={(stats?.economiasPorMes || []).slice().reverse().map((item) => ({
              ...item,
              mesLabel: item.mes ? `${MES_LABELS[item.mes.split('-')[1]] || item.mes}/${item.mes.split('-')[0].slice(2)}` : item.mes,
            }))}>
              <defs>
                <linearGradient id="colorEcon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mesLabel" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TipBox />} />
              <Area type="monotone" dataKey="valor" name="Economias" stroke="#6366f1" strokeWidth={3} fill="url(#colorEcon)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historico */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-primary-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Historico de Registros</h2>
              <p className="text-xs text-slate-400">Todos os aportes, rendimentos e saques</p>
            </div>
          </div>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="input w-auto">
            <option value="">Todos os tipos</option>
            <option value="deposito">Depositos</option>
            <option value="rendimento">Rendimentos</option>
            <option value="saque">Saques</option>
          </select>
        </div>

        {econFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-semibold">Nenhum registro encontrado</p>
            <p className="text-slate-400 text-sm">Clique em "Novo Registro" para comecar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {econFiltradas.map((econ) => {
              const info = tipoInfo[econ.tipo];
              const Icon = info.icon;
              return (
                <div key={econ.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${info.bg}`}>
                    <Icon className={`w-5 h-5 ${info.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{econ.descricao}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className={`font-bold ${info.color}`}>{info.label}</span>
                      {econ.fonte && (<><span>·</span><span>{econ.fonte}</span></>)}
                      <span>·</span>
                      <span>{formatDate(econ.data)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold ${econ.tipo === 'saque' ? 'text-red-600' : 'text-success-600'}`}>
                      {info.sign}{formatCurrency(econ.valor)}
                    </p>
                  </div>
                  <button onClick={() => removeEcon(econ.id!)} className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
