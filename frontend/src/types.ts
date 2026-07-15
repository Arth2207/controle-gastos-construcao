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

export type EtapaCasa = 'fundacao' | 'paredes' | 'laje' | 'portas' | 'janelas' | 'decoracao';

export interface ModeloEtapa {
  id?: number;
  modelo_id?: number;
  etapa: EtapaCasa;
  concluida: number;
  dados_json?: string;
  dados?: any;
  created_at?: string;
}

export interface Comodo {
  nome: string;
  x: number;
  y: number;
  largura: number;
  comprimento: number;
}

export interface ModeloCasa {
  id?: number;
  nome: string;
  largura: number;
  comprimento: number;
  altura_pe_direito: number;
  num_andares: number;
  num_comodos: number;
  espessura_parede: number;
  dados_json?: string;
  dados?: {
    comodos?: Comodo[];
    portas?: Array<{ x: number; y: number; largura: number; altura: number; parede: 'frente' | 'fundo' | 'esquerda' | 'direita' }>;
    janelas?: Array<{ x: number; y: number; largura: number; altura: number; parede: 'frente' | 'fundo' | 'esquerda' | 'direita' }>;
  };
  etapas?: ModeloEtapa[];
  created_at?: string;
}
