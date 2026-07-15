import { Gasto, Categoria, DashboardStats, Economia, Meta, ModeloCasa, EtapaCasa } from './types';

const API_BASE = '/api';

export const api = {
  // Categorias
  getCategorias: async (): Promise<Categoria[]> => {
    const response = await fetch(`${API_BASE}/categorias`);
    return response.json();
  },

  createCategoria: async (categoria: Omit<Categoria, 'id' | 'created_at'>): Promise<Categoria> => {
    const response = await fetch(`${API_BASE}/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoria),
    });
    return response.json();
  },

  deleteCategoria: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/categorias/${id}`, { method: 'DELETE' });
  },

  // Gastos
  getGastos: async (params?: {
    tipo?: string;
    categoria_id?: number;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<Gasto[]> => {
    const queryParams = new URLSearchParams();
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.categoria_id) queryParams.append('categoria_id', params.categoria_id.toString());
    if (params?.data_inicio) queryParams.append('data_inicio', params.data_inicio);
    if (params?.data_fim) queryParams.append('data_fim', params.data_fim);
    
    const response = await fetch(`${API_BASE}/gastos?${queryParams}`);
    return response.json();
  },

  getGasto: async (id: number): Promise<Gasto> => {
    const response = await fetch(`${API_BASE}/gastos/${id}`);
    return response.json();
  },

  createGasto: async (gasto: Omit<Gasto, 'id' | 'created_at' | 'updated_at'>): Promise<Gasto> => {
    const response = await fetch(`${API_BASE}/gastos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gasto),
    });
    return response.json();
  },

  updateGasto: async (id: number, gasto: Omit<Gasto, 'id' | 'created_at' | 'updated_at'>): Promise<Gasto> => {
    const response = await fetch(`${API_BASE}/gastos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gasto),
    });
    return response.json();
  },

  deleteGasto: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/gastos/${id}`, { method: 'DELETE' });
  },

  // Dashboard
  getDashboardStats: async (params?: {
    data_inicio?: string;
    data_fim?: string;
  }): Promise<DashboardStats> => {
    const queryParams = new URLSearchParams();
    if (params?.data_inicio) queryParams.append('data_inicio', params.data_inicio);
    if (params?.data_fim) queryParams.append('data_fim', params.data_fim);
    
    const response = await fetch(`${API_BASE}/dashboard/stats?${queryParams}`);
    return response.json();
  },

  // Economias
  getEconomias: async (): Promise<Economia[]> => {
    const response = await fetch(`${API_BASE}/economias`);
    return response.json();
  },

  createEconomia: async (economia: Omit<Economia, 'id' | 'created_at'>): Promise<Economia> => {
    const response = await fetch(`${API_BASE}/economias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(economia),
    });
    return response.json();
  },

  deleteEconomia: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/economias/${id}`, { method: 'DELETE' });
  },

  // Metas
  getMetas: async (): Promise<Meta[]> => {
    const response = await fetch(`${API_BASE}/metas`);
    return response.json();
  },

  createMeta: async (meta: Omit<Meta, 'id' | 'created_at'>): Promise<Meta> => {
    const response = await fetch(`${API_BASE}/metas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    });
    return response.json();
  },

  deleteMeta: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/metas/${id}`, { method: 'DELETE' });
  },

  // Modelos de Casa
  getModelos: async (): Promise<ModeloCasa[]> => {
    const response = await fetch(`${API_BASE}/modelos`);
    return response.json();
  },

  createModelo: async (modelo: Omit<ModeloCasa, 'id' | 'created_at' | 'etapas' | 'dados_json'>): Promise<ModeloCasa> => {
    const response = await fetch(`${API_BASE}/modelos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modelo),
    });
    return response.json();
  },

  updateModelo: async (id: number, modelo: Partial<ModeloCasa>): Promise<ModeloCasa> => {
    const response = await fetch(`${API_BASE}/modelos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modelo),
    });
    return response.json();
  },

  deleteModelo: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/modelos/${id}`, { method: 'DELETE' });
  },

  updateEtapa: async (modeloId: number, etapa: EtapaCasa, concluida: boolean, dados?: any): Promise<any> => {
    const response = await fetch(`${API_BASE}/modelos/${modeloId}/etapas/${etapa}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concluida, dados }),
    });
    return response.json();
  },
};
