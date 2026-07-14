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
  categoria_nome?: string;
  categoria_tipo?: string;
}

export interface Economia {
  id?: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'deposito' | 'rendimento' | 'saque';
  fonte?: string;
  observacoes?: string;
  created_at?: string;
}

export interface Meta {
  id?: number;
  nome: string;
  valor_objetivo: number;
  data_limite?: string;
  created_at?: string;
}

export interface DashboardStats {
  totalGastos: number;
  totalMateriais: number;
  totalMaoDeObra: number;
  gastosPorCategoria: Array<{ categoria: string; valor: number }>;
  gastosPorMes: Array<{ mes: string; valor: number }>;
  gastosRecentes: Gasto[];
  totalEconomias: number;
  totalAportes: number;
  totalRendimentos: number;
  totalSaques: number;
  economiasPorMes: Array<{ mes: string; valor: number }>;
  metas: Meta[];
}
