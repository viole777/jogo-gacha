const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const db = require('../database');

/**
 * Middleware de autenticação
 * Verifica o token JWT no header Authorization
 * Adiciona o usuário autenticado ao request
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtSecret);

    // Busca o usuário no banco para garantir que ainda existe
    const user = db
      .prepare('SELECT id, username, email, is_admin FROM users WHERE id = ?')
      .get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
  db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

/**
 * Middleware de autorização de admin
 * Deve ser usado APÓS o middleware authenticate
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.is_admin !== 1) {
    return res.status(403).json({ error: 'Acesso negado: requer permissão de administrador' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };