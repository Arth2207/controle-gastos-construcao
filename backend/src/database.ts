import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/construcao.db');
const db = new Database(dbPath);

// Habilitar chaves estrangeiras
db.pragma('foreign_keys = ON');

// Criar tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL CHECK(tipo IN ('material', 'mao_de_obra', 'outro')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    categoria_id INTEGER,
    tipo TEXT NOT NULL CHECK(tipo IN ('material', 'mao_de_obra', 'outro')),
    data DATE NOT NULL,
    fornecedor TEXT,
    quantidade REAL DEFAULT 1,
    unidade TEXT,
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
  );

  CREATE TABLE IF NOT EXISTS orcamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    valor_total REAL NOT NULL,
    data_inicio DATE,
    data_fim_prevista DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Inserir categorias padrão se não existirem
const stmt = db.prepare('SELECT COUNT(*) as count FROM categorias');
const result = stmt.get() as { count: number };

if (result.count === 0) {
  const categoriasPadrao = [
    { nome: 'Cimento', tipo: 'material' },
    { nome: 'Areia', tipo: 'material' },
    { nome: 'Brita', tipo: 'material' },
    { nome: 'Tijolos', tipo: 'material' },
    { nome: 'Madeira', tipo: 'material' },
    { nome: 'Aço/Ferro', tipo: 'material' },
    { nome: 'Tubulações', tipo: 'material' },
    { nome: 'Elétrica', tipo: 'material' },
    { nome: 'Pintura', tipo: 'material' },
    { nome: 'Azulejos', tipo: 'material' },
    { nome: 'Pedreiro', tipo: 'mao_de_obra' },
    { nome: 'Eletricista', tipo: 'mao_de_obra' },
    { nome: 'Encanador', tipo: 'mao_de_obra' },
    { nome: 'Pintor', tipo: 'mao_de_obra' },
    { nome: 'Arquiteto/Engenheiro', tipo: 'mao_de_obra' },
    { nome: 'Outros', tipo: 'outro' }
  ];

  const insertCategoria = db.prepare('INSERT INTO categorias (nome, tipo) VALUES (?, ?)');
  const insertMany = db.transaction((cats: any[]) => {
    for (const cat of cats) {
      insertCategoria.run(cat.nome, cat.tipo);
    }
  });
  insertMany(categoriasPadrao);
}

export default db;
