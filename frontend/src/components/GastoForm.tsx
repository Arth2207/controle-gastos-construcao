import { useState, useEffect } from 'react';
import { Gasto, Categoria } from '../types';
import { api } from '../api';
import { formatCurrency } from '../lib/utils';
import { Save, X, Package, Users, MoreHorizontal, Calculator } from 'lucide-react';

interface GastoFormProps {
  gasto?: Gasto;
  onSave: () => void;
  onCancel: () => void;
}

const tipoConfig = {
  material: { label: 'Material', icon: Package, gradient: 'bg-gradient-success', ring: 'ring-success-400' },
  mao_de_obra: { label: 'Mao de Obra', icon: Users, gradient: 'bg-gradient-warning', ring: 'ring-warning-400' },
  outro: { label: 'Outro', icon: MoreHorizontal, gradient: 'bg-gradient-accent', ring: 'ring-accent-400' },
};

export function GastoForm({ gasto, onSave, onCancel }: GastoFormProps) {
  const [formData, setFormData] = useState<Omit<Gasto, 'id' | 'created_at' | 'updated_at'>>({
    descricao: '',
    valor: 0,
    categoria_id: undefined,
    tipo: 'material',
    data: new Date().toISOString().split('T')[0],
    fornecedor: '',
    quantidade: 1,
    unidade: '',
    observacoes: '',
  });

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategorias();
    if (gasto) {
      setFormData({
        descricao: gasto.descricao,
        valor: gasto.valor,
        categoria_id: gasto.categoria_id,
        tipo: gasto.tipo,
        data: gasto.data,
        fornecedor: gasto.fornecedor || '',
        quantidade: gasto.quantidade || 1,
        unidade: gasto.unidade || '',
        observacoes: gasto.observacoes || '',
      });
    }
  }, [gasto]);

  const loadCategorias = async () => {
    try {
      const data = await api.getCategorias();
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (gasto?.id) {
        await api.updateGasto(gasto.id, formData);
      } else {
        await api.createGasto(formData);
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar gasto:', error);
      alert('Erro ao salvar gasto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'valor' || name === 'quantidade' ? parseFloat(value) || 0 : value,
    }));
  };

  const categoriasFiltradas = categorias.filter((c) => c.tipo === formData.tipo);
  const valorUnitario = formData.quantidade && formData.quantidade > 0 ? formData.valor / formData.quantidade : 0;

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-dark -m-6 mb-6 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {gasto ? 'Editar Gasto' : 'Novo Gasto'}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              {gasto ? 'Atualize as informacoes do gasto' : 'Registre um novo gasto da obra'}
            </p>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div>
            <label className="label">Tipo de Gasto</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(tipoConfig) as Array<keyof typeof tipoConfig>).map((tipo) => {
                const config = tipoConfig[tipo];
                const Icon = config.icon;
                const isSelected = formData.tipo === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, tipo, categoria_id: undefined }))}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? `${config.gradient} text-white border-transparent shadow-lg scale-105`
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-semibold">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="label">Categoria</label>
            <select name="categoria_id" value={formData.categoria_id || ''} onChange={handleChange} className="input">
              <option value="">Selecione uma categoria</option>
              {categoriasFiltradas.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          {/* Descricao */}
          <div>
            <label className="label">Descricao</label>
            <input
              type="text"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              className="input"
              required
              placeholder="Ex: Compra de cimento, Servico de pedreiro..."
            />
          </div>

          {/* Valor, Quantidade, Unidade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Valor Total (R$)</label>
              <input type="number" name="valor" value={formData.valor} onChange={handleChange} className="input" required min="0" step="0.01" placeholder="0,00" />
            </div>
            <div>
              <label className="label">Quantidade</label>
              <input type="number" name="quantidade" value={formData.quantidade} onChange={handleChange} className="input" min="0" step="0.01" placeholder="1" />
            </div>
            <div>
              <label className="label">Unidade</label>
              <input type="text" name="unidade" value={formData.unidade} onChange={handleChange} className="input" placeholder="kg, m, un, hora..." />
            </div>
          </div>

          {/* Valor unitario info */}
          {formData.quantidade && formData.quantidade > 1 && (
            <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl p-4 animate-scale-in">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-primary-500 font-medium">Valor unitario calculado</p>
                <p className="text-lg font-bold text-primary-700">{formatCurrency(valorUnitario)} / {formData.unidade || 'un'}</p>
              </div>
            </div>
          )}

          {/* Data e Fornecedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Data</label>
              <input type="date" name="data" value={formData.data} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="label">Fornecedor</label>
              <input type="text" name="fornecedor" value={formData.fornecedor} onChange={handleChange} className="input" placeholder="Nome do fornecedor ou profissional" />
            </div>
          </div>

          {/* Observacoes */}
          <div>
            <label className="label">Observacoes</label>
            <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} className="input" rows={3} placeholder="Detalhes adicionais..." />
          </div>

          {/* Botoes */}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
