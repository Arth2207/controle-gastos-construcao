# Controle de Gastos - Construção Civil

Sistema completo para controle de gastos de construção civil com dashboard interativo, categorização de materiais e mão de obra, e relatórios visuais.

## Tecnologias

- **Backend**: Node.js + Express + TypeScript + SQLite (better-sqlite3)
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Recharts + Lucide Icons
- **Banco de dados**: SQLite (arquivo local em `data/construcao.db`)

## Funcionalidades

- **Dashboard interativo** com indicadores:
  - Total de gastos
  - Separado por Material, Mão de Obra e Outros
  - Gráfico de gastos por categoria
  - Gráfico de distribuição (pizza)
  - Gráfico de gastos por mês
  - Tabela de gastos recentes

- **Cadastro de gastos** com:
  - Descrição, valor, data
  - Tipo (Material, Mão de Obra, Outro)
  - Categoria (filtrada por tipo)
  - Fornecedor
  - Quantidade e unidade (com cálculo de valor unitário automático)
  - Observações

- **Gestão de categorias**:
  - Categorias pré-cadastradas (cimento, areia, pedreiro, eletricista, etc.)
  - Criar, excluir categorias personalizadas
  - Agrupadas por tipo

- **Lista de gastos** com:
  - Busca por descrição ou fornecedor
  - Filtros por tipo e categoria
  - Total filtrado em tempo real
  - Editar e excluir gastos

## Como executar

### 1. Instalar dependências

```bash
# Na raiz do projeto
npm install

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 2. Rodar em desenvolvimento

Na raiz do projeto:

```bash
npm run dev
```

Isso iniciará:
- Backend na porta `http://localhost:3001`
- Frontend na porta `http://localhost:5173`

Acesse: `http://localhost:5173`

## Estrutura do projeto

```
controle-gastos-construcao/
├── package.json          # Scripts para rodar ambos (concurrently)
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts      # Servidor Express
│       ├── database.ts   # Configuração SQLite + schema
│       ├── routes.ts     # Rotas da API
│       └── models.ts     # Interfaces TypeScript
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api.ts         # Cliente API
        ├── types.ts       # Tipos compartilhados
        ├── index.css      # Estilos Tailwind
        ├── lib/
        │   └── utils.ts   # Helpers (formatCurrency, etc.)
        └── components/
            ├── Layout.tsx     # Sidebar + layout
            ├── Dashboard.tsx  # Gráficos e indicadores
            ├── GastoForm.tsx  # Formulário de gasto
            ├── GastoList.tsx  # Tabela com filtros
            └── Categorias.tsx # Gestão de categorias
```

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/categorias` | Lista categorias |
| POST | `/api/categorias` | Cria categoria |
| DELETE | `/api/categorias/:id` | Deleta categoria |
| GET | `/api/gastos` | Lista gastos (filtros: tipo, categoria_id, data_inicio, data_fim) |
| GET | `/api/gastos/:id` | Busca gasto por ID |
| POST | `/api/gastos` | Cria gasto |
| PUT | `/api/gastos/:id` | Atualiza gasto |
| DELETE | `/api/gastos/:id` | Deleta gasto |
| GET | `/api/dashboard/stats` | Estatísticas do dashboard |
