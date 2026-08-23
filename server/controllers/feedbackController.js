const db = require('../database');

const TYPES = new Set(['bug', 'complaint', 'suggestion']);
const PRIORITIES = new Set(['low', 'normal', 'high']);
const STATUSES = new Set(['open', 'reviewing', 'resolved']);

function text(value, label, max) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`${label} é obrigatório`);
    error.status = 400;
    throw error;
  }
  const result = value.trim();
  if (result.length > max) {
    const error = new Error(`${label} deve ter no máximo ${max} caracteres`);
    error.status = 400;
    throw error;
  }
  return result;
}

function createFeedback(req, res) {
  try {
    const type = req.body.type || 'bug';
    const priority = req.body.priority || 'normal';
    if (!TYPES.has(type)) return res.status(400).json({ error: 'Tipo de relato inválido' });
    if (!PRIORITIES.has(priority)) return res.status(400).json({ error: 'Prioridade inválida' });
    const title = text(req.body.title, 'Título', 100);
    const description = text(req.body.description, 'Descrição', 2000);
    const result = db.prepare(
      `INSERT INTO feedback_reports (user_id, type, priority, title, description)
       VALUES (?, ?, ?, ?, ?)`
    ).run(req.user.id, type, priority, title, description);
    return res.status(201).json({ message: 'Relato enviado com sucesso!', report_id: result.lastInsertRowid });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}

function getAdminFeedback(req, res) {
  const status = req.query.status || 'all';
  if (status !== 'all' && !STATUSES.has(status)) return res.status(400).json({ error: 'Status inválido' });
  const reports = db.prepare(`
    SELECT f.id, f.type, f.priority, f.title, f.description, f.status, f.admin_note,
           f.created_at, f.updated_at, u.id AS user_id, u.username, u.email
    FROM feedback_reports f JOIN users u ON u.id = f.user_id
    WHERE (? = 'all' OR f.status = ?)
    ORDER BY CASE f.status WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,
             CASE f.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
             f.created_at DESC
  `).all(status, status);
  return res.json({ reports, count: reports.length });
}

function updateAdminFeedback(req, res) {
  const reportId = Number(req.params.id);
  const status = req.body.status;
  if (!Number.isInteger(reportId) || reportId < 1 || !STATUSES.has(status)) {
    return res.status(400).json({ error: 'Relato ou status inválido' });
  }
  let note = null;
  if (req.body.admin_note !== null && req.body.admin_note !== undefined && req.body.admin_note !== '') {
    try { note = text(req.body.admin_note, 'Observação', 1000); } catch (error) { return res.status(error.status).json({ error: error.message }); }
  }
  const result = db.prepare(
    'UPDATE feedback_reports SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(status, note, reportId);
  if (result.changes !== 1) return res.status(404).json({ error: 'Relato não encontrado' });
  return res.json({ message: 'Status do relato atualizado!' });
}

module.exports = { createFeedback, getAdminFeedback, updateAdminFeedback };