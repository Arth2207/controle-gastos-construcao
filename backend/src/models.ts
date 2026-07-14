export interface Categoria {
  id?: number;
  nome: string;
  tipo: 'material' | 'mao_de_obra' | 'outro';
  created_at?: string;
}

export interface Gasto {
  id?: number;
  descricao: string;
  valor: number;
  categoria_id?: number;
  tipo: 'material' | 'mao_de_obra' | 'outro';
  data: string;
  fornecedor?: string;
  quantidade?: number;
  unidade?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GastoComCategoria extends Gasto {
  categoria?: Categoria;
}

export interface Orcamento {
  id?: number;
  nome: string;
  valor_total: number;
  data_inicio?: string;
  data_fim_prevista?: string;
  created_at?: string;
}

export interface DashboardStats {
  totalGastos: number;
  totalMateriais: number;
  totalMaoDeObra: number;
  gastosPorCategoria: Array<{ categoria: string; valor: number }>;
  gastosPorMes: Array<{ mes: string; valor: number }>;
  gastosRecentes: GastoComCategoria[];
}
