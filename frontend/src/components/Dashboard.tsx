import { useEffect, useState, useRef } from 'react';
import { DashboardStats } from '../types';
import { api } from '../api';
import { formatCurrency } from '../lib/utils';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Package, Users, MoreHorizontal, Wallet,
  Calendar, ShoppingCart, Wrench, Sparkles, Plus, Hash, Clock,
} from 'lucide-react';

function useAnimatedNumber(value: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = ref.current;
    const delta = value - start;
    if (delta === 0) return;
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + delta * eased;
      setDisplay(current);
      ref.current = current;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

const CHART_COLORS = ['#6366f1', '#06b6d4', '#f97316', '#22c55e', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

const PIE_COLORS = ['#22c55e', '#f97316', '#8b5cf6'];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold text-slate-700 mb-1">{label}</p>
        <p className="text-lg font-bold text-primary-600">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

function PieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold text-slate-700">{payload[0].name}</p>
        <p className="text-lg font-bold text-primary-600">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

interface DashboardProps {
  onNew?: () => void;
}

export function Dashboard({ onNew }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const animatedTotal = useAnimatedNumber(stats?.totalGastos || 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mb-4">
          <MoreHorizontal className="w-10 h-10 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-slate-700">Erro ao carregar dados</p>
        <p className="text-sm text-slate-400">Verifique se o backend esta rodando</p>
      </div>
    );
  }

  const totalOutros = stats.totalGastos - stats.totalMateriais - stats.totalMaoDeObra;
  const isEmpty = stats.totalGastos === 0;

  const pieData = [
    { name: 'Materiais', value: stats.totalMateriais },
    { name: 'Mao de Obra', value: stats.totalMaoDeObra },
    { name: 'Outros', value: totalOutros },
  ].filter((d) => d.value > 0);

  const pctMateriais = stats.totalGastos > 0 ? (stats.totalMateriais / stats.totalGastos) * 100 : 0;
  const pctMaoDeObra = stats.totalGastos > 0 ? (stats.totalMaoDeObra / stats.totalGastos) * 100 : 0;
  const pctOutros = stats.totalGastos > 0 ? (totalOutros / stats.totalGastos) * 100 : 0;

  const monthLabels: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
  };

  const gastosPorMesFormatted = stats.gastosPorMes.slice().reverse().map((item) => ({
    ...item,
    mesLabel: item.mes ? `${monthLabels[item.mes.split('-')[1]] || item.mes}/${item.mes.split('-')[0].slice(2)}` : item.mes,
  }));

  // This month vs last month
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthTotal = stats.gastosPorMes.find((m) => m.mes === thisMonthKey)?.valor || 0;
  const lastMonthTotal = stats.gastosPorMes.find((m) => m.mes === lastMonthKey)?.valor || 0;
  const monthDiff = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : thisMonthTotal > 0 ? 100 : 0;

  // Top 5 categorias
  const topCategorias = [...stats.gastosPorCategoria].filter((c) => c.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 5);
  const maxCat = topCategorias[0]?.valor || 1;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-dark p-8 text-white shadow-2xl shadow-primary-500/20">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-accent-500/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary-300" />
              <span className="text-sm font-semibold text-primary-200 uppercase tracking-wider">Visao Geral da Obra</span>
            </div>
            <p className="text-white/60 text-sm font-medium mb-1">Total investido na construcao</p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
              {formatCurrency(animatedTotal)}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                {monthDiff >= 0 ? <TrendingUp className="w-4 h-4 text-red-300" /> : <TrendingDown className="w-4 h-4 text-green-300" />}
                <span className="text-sm font-medium text-white/80">
                  {monthDiff >= 0 ? '+' : ''}{monthDiff.toFixed(1)}% vs mes anterior
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                <Hash className="w-4 h-4 text-primary-300" />
                <span className="text-sm font-medium text-white/80">{stats.gastosRecentes.length} registros recentes</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2 capitalize">
                <Calendar className="w-4 h-4 text-accent-300" />
                <span className="text-sm font-medium text-white/80">
                  {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          {onNew && (
            <button
              onClick={onNew}
              className="flex items-center gap-2 bg-white text-primary-700 font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Adicionar Gasto
            </button>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="card text-center py-20">
          <div className="w-24 h-24 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Nenhum gasto cadastrado</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Comece a registrar os gastos da sua construcao para ver graficos, indicadores e estatisticas aqui.
          </p>
          {onNew && (
            <button onClick={onNew} className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Registrar Primeiro Gasto
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Materiais */}
            <div className="stat-card bg-gradient-success group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">{pctMateriais.toFixed(0)}%</span>
                </div>
                <p className="text-white/70 text-sm font-medium mb-1">Materiais</p>
                <p className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(stats.totalMateriais)}</p>
                <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/60 rounded-full transition-all duration-700" style={{ width: `${pctMateriais}%` }} />
                </div>
              </div>
            </div>

            {/* Mao de Obra */}
            <div className="stat-card bg-gradient-warning group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">{pctMaoDeObra.toFixed(0)}%</span>
                </div>
                <p className="text-white/70 text-sm font-medium mb-1">Mao de Obra</p>
                <p className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(stats.totalMaoDeObra)}</p>
                <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/60 rounded-full transition-all duration-700" style={{ width: `${pctMaoDeObra}%` }} />
                </div>
              </div>
            </div>

            {/* Outros */}
            <div className="stat-card bg-gradient-accent group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <MoreHorizontal className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">{pctOutros.toFixed(0)}%</span>
                </div>
                <p className="text-white/70 text-sm font-medium mb-1">Outros</p>
                <p className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(totalOutros)}</p>
                <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/60 rounded-full transition-all duration-700" style={{ width: `${pctOutros}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Pie + Top 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart - Distribution */}
            <div className="card card-hover">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-primary-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Distribuicao</h2>
                  <p className="text-xs text-slate-400">Proporcao por tipo</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 mt-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                      <span className="text-slate-600 font-medium">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">{formatCurrency(entry.value)}</span>
                      <span className="text-xs text-slate-400 ml-1.5">({((entry.value / stats.totalGastos) * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Categorias */}
            <div className="card card-hover lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Top 5 Categorias</h2>
                  <p className="text-xs text-slate-400">Maiores gastos por categoria</p>
                </div>
              </div>
              <div className="space-y-4">
                {topCategorias.map((cat, index) => {
                  const pct = (cat.valor / maxCat) * 100;
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  return (
                    <div key={cat.categoria} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: color }}>
                            {index + 1}
                          </span>
                          <span className="font-semibold text-slate-700">{cat.categoria}</span>
                        </div>
                        <span className="font-bold text-slate-800">{formatCurrency(cat.valor)}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out group-hover:brightness-110" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
                {topCategorias.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">Nenhuma categoria com gastos.</p>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2 - Monthly Trend */}
          <div className="card card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Evolucao Mensal</h2>
                  <p className="text-xs text-slate-400">Gastos por mes</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-lg bg-gradient-primary" />
                <span>Gastos</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={gastosPorMesFormatted}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mesLabel" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={3} fill="url(#colorValor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Expenses */}
          <div className="card card-hover">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Gastos Recentes</h2>
                  <p className="text-xs text-slate-400">Ultimos 10 registros</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {stats.gastosRecentes.map((gasto, index) => {
                const isMaterial = gasto.tipo === 'material';
                const isLabor = gasto.tipo === 'mao_de_obra';
                const Icon = isMaterial ? ShoppingCart : isLabor ? Wrench : MoreHorizontal;
                const bgColor = isMaterial ? 'bg-success-100 text-success-600' : isLabor ? 'bg-warning-100 text-warning-600' : 'bg-slate-100 text-slate-500';

                return (
                  <div
                    key={gasto.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{gasto.descricao}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{gasto.categoria_nome || 'Sem categoria'}</span>
                        {gasto.fornecedor && (
                          <>
                            <span>·</span>
                            <span>{gasto.fornecedor}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{new Date(gasto.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-slate-800">{formatCurrency(gasto.valor)}</p>
                      <span className={`badge ${isMaterial ? 'badge-material' : isLabor ? 'badge-labor' : 'badge-other'}`}>
                        {isMaterial ? 'Material' : isLabor ? 'Mao de Obra' : 'Outro'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
