const express = require('express');
const db = require('./database');

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
    res.status(400).json({ error: 'Categoria ja existe ou dados invalidos' });
  }
});

router.delete('/categorias/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM categorias WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Categoria nao encontrada' });
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
  const params = [];

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
    res.status(404).json({ error: 'Gasto nao encontrado' });
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
    const result = stmt.run(descricao, valor, categoria_id || null, tipo, data, fornecedor || null, quantidade || 1, unidade || null, observacoes || null);
    
    const gasto = db.prepare(`
      SELECT g.*, c.nome as categoria_nome, c.tipo as categoria_tipo 
      FROM gastos g 
      LEFT JOIN categorias c ON g.categoria_id = c.id 
      WHERE g.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json(gasto);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar gasto: ' + error.message });
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
    const result = stmt.run(descricao, valor, categoria_id || null, tipo, data, fornecedor || null, quantidade || 1, unidade || null, observacoes || null, id);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Gasto nao encontrado' });
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
    res.status(400).json({ error: 'Erro ao atualizar gasto: ' + error.message });
  }
});

router.delete('/gastos/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM gastos WHERE id = ?');
  const result = stmt.run(id);
  
  if (result.changes === 0) {
    res.status(404).json({ error: 'Gasto nao encontrado' });
  } else {
    res.json({ message: 'Gasto deletado' });
  }
});

// Dashboard
router.get('/dashboard/stats', (req, res) => {
  const { data_inicio, data_fim } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (data_inicio) {
    whereClause += ' AND data >= ?';
    params.push(data_inicio);
  }
  if (data_fim) {
    whereClause += ' AND data <= ?';
    params.push(data_fim);
  }

  const totalGastos = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM gastos ${whereClause}`).get(...params);
  
  const totalMateriais = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM gastos ${whereClause} AND tipo = 'material'`).get(...params);
  const totalMaoDeObra = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM gastos ${whereClause} AND tipo = 'mao_de_obra'`).get(...params);
  
  const gastosPorCategoria = db.prepare(`
    SELECT c.nome as categoria, COALESCE(SUM(g.valor), 0) as valor 
    FROM categorias c 
    LEFT JOIN gastos g ON c.id = g.categoria_id 
    GROUP BY c.id, c.nome
    ORDER BY valor DESC
  `).all();
  
  const gastosPorMes = db.prepare(`
    SELECT strftime('%Y-%m', data) as mes, COALESCE(SUM(valor), 0) as valor 
    FROM gastos 
    ${whereClause}
    GROUP BY strftime('%Y-%m', data)
    ORDER BY mes DESC
    LIMIT 12
  `).all(...params);
  
  const gastosRecentes = db.prepare(`
    SELECT g.*, c.nome as categoria_nome, c.tipo as categoria_tipo 
    FROM gastos g 
    LEFT JOIN categorias c ON g.categoria_id = c.id 
    ${whereClause}
    ORDER BY g.data DESC, g.created_at DESC
    LIMIT 10
  `).all(...params);

  // Economias e KPIs
  const totalEconomias = db.prepare(`SELECT COALESCE(SUM(CASE WHEN tipo = 'saque' THEN -valor ELSE valor END), 0) as total FROM economias`).get();
  const totalAportes = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM economias WHERE tipo = 'deposito'`).get();
  const totalRendimentos = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM economias WHERE tipo = 'rendimento'`).get();
  const totalSaques = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM economias WHERE tipo = 'saque'`).get();

  const economiasPorMes = db.prepare(`
    SELECT strftime('%Y-%m', data) as mes, COALESCE(SUM(CASE WHEN tipo = 'saque' THEN -valor ELSE valor END), 0) as valor 
    FROM economias 
    GROUP BY strftime('%Y-%m', data)
    ORDER BY mes DESC
    LIMIT 12
  `).all();

  const metas = db.prepare('SELECT * FROM metas ORDER BY data_limite, nome').all();

  res.json({
    totalGastos: totalGastos.total,
    totalMateriais: totalMateriais.total,
    totalMaoDeObra: totalMaoDeObra.total,
    gastosPorCategoria,
    gastosPorMes,
    gastosRecentes,
    totalEconomias: totalEconomias.total,
    totalAportes: totalAportes.total,
    totalRendimentos: totalRendimentos.total,
    totalSaques: totalSaques.total,
    economiasPorMes,
    metas
  });
});

// Economias
router.get('/economias', (req, res) => {
  const economias = db.prepare('SELECT * FROM economias ORDER BY data DESC, created_at DESC').all();
  res.json(economias);
});

router.post('/economias', (req, res) => {
  const { descricao, valor, data, tipo, fonte, observacoes } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO economias (descricao, valor, data, tipo, fonte, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(descricao, valor, data, tipo, fonte || null, observacoes || null);
    const economia = db.prepare('SELECT * FROM economias WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(economia);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar economia: ' + error.message });
  }
});

router.delete('/economias/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM economias WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Economia nao encontrada' });
  } else {
    res.json({ message: 'Economia deletada' });
  }
});

// Metas
router.get('/metas', (req, res) => {
  const metas = db.prepare('SELECT * FROM metas ORDER BY data_limite, nome').all();
  res.json(metas);
});

router.post('/metas', (req, res) => {
  const { nome, valor_objetivo, data_limite } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO metas (nome, valor_objetivo, data_limite) VALUES (?, ?, ?)');
    const result = stmt.run(nome, valor_objetivo, data_limite || null);
    const meta = db.prepare('SELECT * FROM metas WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(meta);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar meta: ' + error.message });
  }
});

router.delete('/metas/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM metas WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Meta nao encontrada' });
  } else {
    res.json({ message: 'Meta deletada' });
  }
});

module.exports = router;
