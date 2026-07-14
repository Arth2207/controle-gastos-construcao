import express from 'express';
import db from './database';
import { Gasto, Categoria, DashboardStats } from './models';

const router = express.Router();

// Categorias
router.get('/categorias', (req, res) => {
  const categorias = db.prepare('SELECT * FROM categorias ORDER BY tipo, nome').all();
  res.json(categorias);
});

router.post('/categorias', (req, res) => {
  const { nome, tipo } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO categorias (nome, tipo) VALUES (?, ?)');
    const result = stmt.run(nome, tipo);
    const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(categoria);
  } catch (error) {
    res.status(400).json({ error: 'Categoria já existe ou dados inválidos' });
  }
});

router.delete('/categorias/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM categorias WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Categoria não encontrada' });
  } else {
    res.json({ message: 'Categoria deletada' });
  }
});

// Gastos
router.get('/gastos', (req, res) => {
  const { tipo, categoria_id, data_inicio, data_fim } = req.query;
  
  let query = `
    SELECT g.*, c.nome as categoria_nome, c.tipo as categoria_tipo 
    FROM gastos g 
    LEFT JOIN categorias c ON g.categoria_id = c.id 
    WHERE 1=1
  `;
  const params: any[] = [];

  if (tipo) {
    query += ' AND g.tipo = ?';
    params.push(tipo);
  }
  if (categoria_id) {
    query += ' AND g.categoria_id = ?';
    params.push(categoria_id);
  }
  if (data_inicio) {
    query += ' AND g.data >= ?';
    params.push(data_inicio);
  }
  if (data_fim) {
    query += ' AND g.data <= ?';
    params.push(data_fim);
  }

  query += ' ORDER BY g.data DESC';
  
  const gastos = db.prepare(query).all(...params);
  res.json(gastos);
});

router.get('/gastos/:id', (req, res) => {
  const { id } = req.params;
  const gasto = db.prepare(`
    SELECT g.*, c.nome as categoria_nome, c.tipo as categoria_tipo 
    FROM gastos g 
    LEFT JOIN categorias c ON g.categoria_id = c.id 
    WHERE g.id = ?
  `).get(id);
  
  if (!gasto) {
    res.status(404).json({ error: 'Gasto não encontrado' });
  } else {
    res.json(gasto);
  }
});

router.post('/gastos', (req, res) => {
  const { descricao, valor, categoria_id, tipo, data, fornecedor, quantidade, unidade, observacoes } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO gastos (descricao, valor, categoria_id, tipo, data, fornecedor, quantidade, unidade, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(descricao, valor, categoria_id, tipo, data, fornecedor, quantidade, unidade, observacoes);
    
    const gasto = db.prepare(`
      SELECT g.*, c.nome as categoria_nome, c.tipo as categoria_tipo 
      FROM gastos g 
      LEFT JOIN categorias c ON g.categoria_id = c.id 
      WHERE g.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json(gasto);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar gasto' });
  }
});

router.put('/gastos/:id', (req, res) => {
  const { id } = req.params;
  const { descricao, valor, categoria_id, tipo, data, fornecedor, quantidade, unidade, observacoes } = req.body;
  
  try {
    const stmt = db.prepare(`
      UPDATE gastos 
      SET descricao = ?, valor = ?, categoria_id = ?, tipo = ?, data = ?, 
          fornecedor = ?, quantidade = ?, unidade = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(descricao, valor, categoria_id, tipo, data, fornecedor, quantidade, unidade, observacoes, id);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Gasto não encontrado' });
    } else {
      const gasto = db.prepare(`
        SELECT g.*, c.nome as categoria_nome, c.tipo as categoria_tipo 
        FROM gastos g 
        LEFT JOIN categorias c ON g.categoria_id = c.id 
        WHERE g.id = ?
      `).get(id);
      res.json(gasto);
    }
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar gasto' });
  }
});

router.delete('/gastos/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM gastos WHERE id = ?');
  const result = stmt.run(id);
  
  if (result.changes === 0) {
    res.status(404).json({ error: 'Gasto não encontrado' });
  } else {
    res.json({ message: 'Gasto deletado' });
  }
});

// Dashboard
router.get('/dashboard/stats', (req, res) => {
  const { data_inicio, data_fim } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  
  if (data_inicio) {
    whereClause += ' AND data >= ?';
    params.push(data_inicio);
  }
  if (data_fim) {
    whereClause += ' AND data <= ?';
    params.push(data_fim);
  }

  // Total geral
  const totalGastos = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM gastos ${whereClause}`).get(...params) as { total: number };
  
  // Total por tipo
  const totalMateriais = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM gastos ${whereClause} AND tipo = 'material'`).get(...params) as { total: number };
  const totalMaoDeObra = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM gastos ${whereClause} AND tipo = 'mao_de_obra'`).get(...params) as { total: number };
  
  // Por categoria
  const gastosPorCategoria = db.prepare(`
    SELECT c.nome as categoria, COALESCE(SUM(g.valor), 0) as valor 
    FROM categorias c 
    LEFT JOIN gastos g ON c.id = g.categoria_id ${whereClause.replace('WHERE 1=1', 'WHERE')}
    GROUP BY c.id, c.nome
    ORDER BY valor DESC
  `).all(...params);
  
  // Por mês
  const gastosPorMes = db.prepare(`
    SELECT strftime('%Y-%m', data) as mes, COALESCE(SUM(valor), 0) as valor 
    FROM gastos 
    ${whereClause}
    GROUP BY strftime('%Y-%m', data)
    ORDER BY mes DESC
    LIMIT 12
  `).all(...params);
  
  // Gastos recentes
  const gastosRecentes = db.prepare(`
    SELECT g.*, c.nome as categoria_nome, c.tipo as categoria_tipo 
    FROM gastos g 
    LEFT JOIN categorias c ON g.categoria_id = c.id 
    ${whereClause}
    ORDER BY g.data DESC, g.created_at DESC
    LIMIT 10
  `).all(...params);

  const stats: DashboardStats = {
    totalGastos: totalGastos.total,
    totalMateriais: totalMateriais.total,
    totalMaoDeObra: totalMaoDeObra.total,
    gastosPorCategoria,
    gastosPorMes,
    gastosRecentes
  };
  
  res.json(stats);
});

export default router;
